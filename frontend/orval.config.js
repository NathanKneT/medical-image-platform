module.exports = {
  api: {
    output: {
      mode: 'single',
      target: 'src/lib/api-client.ts',
      client: 'axios',
      override: {
        mutator: {
          path: 'src/lib/api.ts', 
          name: 'customApi' 
        }
      }
    },
    input: {
      target: '../backend/openapi.json'
    }
  }
};