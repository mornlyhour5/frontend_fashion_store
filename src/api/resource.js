import client from './client'

export function createResource(endpoint) {
  return {
    list(params = {}) {
      return client.get(`/${endpoint}`, { params })
    },

    get(id) {
      return client.get(`/${endpoint}/${id}`)
    },

    // Plain JSON create.
    create(data) {
      return client.post(`/${endpoint}`, data)
    },

    // FormData create (file upload present on create form)
    createForm(formData) {
      return client.post(`/${endpoint}`, formData)
    },

    // Plain JSON update (no file involved)
    update(id, data) { 
      return client.put(`/${endpoint}/${id}`, data)
    },

    // FormData update — must be sent as POST with a _method=PUT override.
    // PHP does not parse multipart/form-data bodies on native PUT requests,
    // so $request->all() would be empty/partial on the Laravel side.
    // Laravel's MethodOverride middleware reads _method on a POST and
    // routes it to the PUT controller action, while still letting PHP
    // parse the multipart body correctly.
    updateForm(id, formData) {
      if (!(formData instanceof FormData)) {
        throw new Error('updateForm expects a FormData instance')
      }
      if (!formData.has('_method')) {
        formData.append('_method', 'PUT')
      }
      return client.post(`/${endpoint}/${id}`, formData)
    },

    remove(id) {
      return client.delete(`/${endpoint}/${id}`)
    },
  }
}