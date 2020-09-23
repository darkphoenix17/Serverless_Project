import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-h5wc26ep.us.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {

  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // TODO: Implement token verification done
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  // return undefined
  const { header } = jwt;

  let key = await getSigningKey(jwksUrl, header.kid)
  return verify(token, key.publicKey, { algorithms: ['RS256'] }) as JwtPayload

}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

const getSigningKey = async (jwkurl, kid) => {
  let res = await Axios.get(jwkurl, {
    headers: {
      'Content-Type': 'application/json',
      "Access-Control-Allow-Origin": "*",
      'Access-Control-Allow-Credentials': true,
    }
  });

  let keys = res.data.keys;
  // since the keys is an array its possible to have many keys in case of cycling.
  const signingKeys = keys.filter(key => key.use === 'sig' // JWK property `use` determines the JWK is for signing
    && key.kty === 'RSA' // We are only supporting RSA
    && key.kid           // The `kid` must be present to be useful for later
    && key.x5c && key.x5c.length // Has useful public keys (we aren't using n or e)
  ).map(key => {
    return { kid: key.kid, nbf: key.nbf, publicKey: certToPEM(key.x5c[0]) };
  });

  const signingKey = signingKeys.find(key => key.kid === kid);
  if (!signingKey) {
    logger.error("No signing keys found")
    throw new Error('Invalid signing keys')
  }

  logger.info("Signing keys created successfully ", signingKey)
  return signingKey

};

function certToPEM(cert) {
  cert = cert.match(/.{1,64}/g).join('\n');
  cert = `-----BEGIN CERTIFICATE-----
  MIIDDTCCAfWgAwIBAgIJDdad1m8Xl5v4MA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
  BAMTGWRldi1oNXdjMjZlcC51cy5hdXRoMC5jb20wHhcNMjAwOTIxMjA0NTI5WhcN
  MzQwNTMxMjA0NTI5WjAkMSIwIAYDVQQDExlkZXYtaDV3YzI2ZXAudXMuYXV0aDAu
  Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAruNUu0p3UVJhWD/A
  iR6okweYmt85WHzAj9ntEXTzzv2nn+mYDP/nOEu/5AqMLn5ctbfpvoC/V+O0YlDb
  Y0nOg+ntW5XYhM25FBJItTvbPxXNOBl0kHTQQCSy9SHxvaZKrregLqgrtfkbneVB
  lJN+9Gx4i6syaIK9PbejOG4zwxI/hwlOsjNKVwiftGMc7EzyKPnl4S0Cqib6vtCd
  XcZJRlhmCDazn920tgDoRnUZHjO0pORp9G0ZlkwlT0DkE+XQWv5uLNBzZ1dh1aJU
  KHzw+0Xdbp0CSwm+Z3xfhrfK8zYkO2BjKE40cqvreHEgUWcDOUAAKpwEeLusdkav
  xQ9D4QIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBTOYlJeILi7
  ZR7bYzI6i9iJF4+G3TAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
  AGH8BmoXMPqcUxJ4R6edimHQDTSRcny3aczm/Nv6Mxgmw6KuJRtl0GytPRABvvva
  z7t4n0zI4sDF1bObAK5S5z1DYwWJES5scAG/gtrpB9wB2pdPplHorzdPzD6OeQX/
  m1OrroE6sb/1eZwYUWX50F/IuhXR/OiS4l2r7xj15cSJ+dWM9HUEVTFY/U8I0UsK
  mCtYNoUr8OGkrxoDnQMSsgG5YLDNXDo3iLdUdUikzo7930S1ufJiKeVV3k9wjoBG
  f6T4FLTQjycWfrSu/TsjmTxxYPGdZ/XUiWDLWZ3r/tJy2rFmoPMDMOZXD5KGy9Gi
  XvmbfzkTbS3S70+oPY3YjVk=
  -----END CERTIFICATE-----`;
  return cert;
}