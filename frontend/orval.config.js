module.exports = {
  api: {
    output: {
      mode: 'single',
      target: 'src/lib/api-client.ts',
      client: 'axios',
      override: {
        mutator: {
          path: 'src/lib/axios-instance.ts',
          name: 'customInstance'
        }
      }
    },
    input: {
      target: '../backend/openapi.json'
    }
  }
};
