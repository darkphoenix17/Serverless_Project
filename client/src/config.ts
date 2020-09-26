// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'rp9qxblx31'
export const apiEndpoint = `https://${apiId}.execute-api.ap-south-1.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map
  domain: 'dev-h5wc26ep.us.auth0.com',            // Auth0 domain
  clientId: 'z7DLR60alJ0AXlrcMoofkVCg9CBeH2yy',          // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}
