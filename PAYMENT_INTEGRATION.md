# Payment & Order Processing — Laravel Backend Contract

This frontend expects the following endpoints. Routes/controller names are
suggestions — match them to whatever you name your `routes/api.php` entries,
then update `src/api/resources.js` if you rename anything.

## 1. Place Order — `POST /api/orders`

Called for **all** payment methods. For `card`, this is called first with
`payment_status: 'pending'` before any money moves; for `cod` / `bank_transfer`
it's the only call needed.

**Request body:**
```json
{
  "address_id": 12,
  "payment_method": "cod | card | bank_transfer",
  "payment_status": "pending | awaiting_transfer",
  "coupon_code": "SUMMER25 | null",
  "items": [
    { "product_variant_id": 45, "quantity": 2, "price": 129.00 }
  ],
  "subtotal": 258.00,
  "shipping_fee": 0,
  "total_amount": 258.00
}
```

**What the controller should do:**
1. Wrap in a DB transaction.
2. Re-validate stock for every `product_variant_id` (never trust the client
   total or trust that stock is still available — the frontend does an
   optimistic client-side check but this is not authoritative).
3. Decrement `product_variants.stock` for each item.
4. Create the `orders` row, then `order_items` rows.
5. If a `coupon_code` was sent, re-validate it server-side (expiry, usage
   limit, minimum order) and insert into `coupon_usages`. Never trust the
   discount amount the client calculated.
6. Insert an `order_status_histories` row: `from_status: null, to_status: 'pending'`.
7. Return the created order, including its `id` — the frontend needs this
   immediately for the next step if `payment_method === 'card'`.

**Response:** the created order object (matches your `orders` table shape).

---

## 2. Create Payment Intent — `POST /api/payments/create-intent`

Only called when `payment_method === 'card'`, immediately after the order
above is created.

**Request:**
```json
{ "order_id": 501, "amount": 25800, "currency": "usd" }
```
(`amount` is in **cents** — Stripe convention.)

**Controller logic (using `stripe/stripe-php`):**
```php
$intent = \Stripe\PaymentIntent::create([
    'amount' => $request->amount,
    'currency' => $request->currency,
    'metadata' => ['order_id' => $request->order_id],
]);

// Store $intent->id somewhere you can look up later (e.g. a `payments` table,
// or just stamp it onto the order row) so the confirm step and webhook can
// find the order again.

return response()->json([
    'client_secret' => $intent->client_secret,
    'payment_id' => $intent->id, // used as the :paymentId path param below
    'provider' => 'stripe',
]);
```

You'll need `STRIPE_SECRET_KEY` in your Laravel `.env` and the `stripe/stripe-php`
composer package.

---

## 3. Confirm Payment — `POST /api/payments/{paymentId}/confirm`

Called right after Stripe.js confirms the card on the client. This is a
**convenience signal**, not the source of truth — see the webhook note below.

**Request:**
```json
{ "order_id": 501, "stripe_payment_intent_id": "pi_xxx", "status": "succeeded" }
```

**Controller logic:**
1. Look up the PaymentIntent server-side via the Stripe SDK (don't just trust
   the client's `status` field) to confirm it's actually `succeeded`.
2. Update `orders.payment_status = 'paid'`, `orders.paid_at = now()`.
3. Insert `order_status_histories` row `to_status: 'processing'`.
4. Trigger your order-confirmation email / notification.

### ⚠️ Important: also add a Stripe webhook

Card payments can succeed *after* the browser tab closes (3D Secure redirects,
network drops after `confirmCardPayment` resolves but before step 4 above
fires). Relying only on the client-side confirm call means some paid orders
never get marked paid. Add:

```
POST /api/webhooks/stripe   (routes/api.php, excluded from CSRF/Sanctum middleware)
```

Listen for `payment_intent.succeeded` and do the same `payment_status = 'paid'`
update there, keyed by `metadata.order_id`. This becomes your real source of
truth; the `/confirm` endpoint above just makes the UI feel instant.

---

## 4. Apply Coupon — `POST /api/checkout/apply-coupon`

**Request:** `{ "code": "SUMMER25", "cart_total": 258.00 }`

**Response (success):**
```json
{ "coupon": { "code": "SUMMER25", "type": "percentage", "value": 15, "maximum_discount": 50 } }
```
Return a 422 with a `message` field if the coupon is invalid, expired, over
its `usage_limit`, or `cart_total` is below `minimum_order` — the frontend
already displays whatever `message` you send back via toast.

---

## 5. Order Status (polling) — `GET /api/orders/{id}/status`

Lightweight endpoint the confirmation page polls every 8s while a
`bank_transfer` order's `payment_status` isn't yet `paid`. Can just be an
alias for `GET /api/orders/{id}` if you don't want a separate lean endpoint —
the frontend calls `ordersApi.get()` directly for this today, so this route
is optional unless you want a cheaper payload for polling.

---

## 6. Product Variants Lookup — `GET /api/products/{id}/variants`

Used by the checkout page's stock-revalidation step right before charging.
Should return the current `product_variants` rows for that product so the
frontend can compare `stock` against the quantity in the cart. If you don't
implement this, checkout still works — it just skips the optimistic
pre-check and relies entirely on the authoritative check in step 1 above.

---

## Notes on `payment_status` values

The frontend uses these strings — keep your `orders.payment_status` enum
(or just varchar values) consistent with them:

- `pending` — COD orders, or card orders before the intent is confirmed
- `awaiting_transfer` — bank transfer orders, not yet reconciled
- `paid` — payment confirmed (COD is never `paid` until delivery/collection,
  by design; card and bank_transfer only)
- `failed` — card payment failed
- `refunded` — refunded after the fact
