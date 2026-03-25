import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, GetUserCommand, AuthFlowType, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider';
import { UserRole } from '../../types';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const CLIENT_ID = process.env.COGNITO_CLIENT_ID || '';

export interface CognitoTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

export async function authenticateUser(email: string, password: string): Promise<CognitoTokens> {
  const command = new InitiateAuthCommand({
    AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  const response = await cognitoClient.send(command);
  
  if (!response.AuthenticationResult) {
    throw new Error('Authentication failed');
  }

  return {
    accessToken: response.AuthenticationResult.AccessToken!,
    idToken: response.AuthenticationResult.IdToken!,
    refreshToken: response.AuthenticationResult.RefreshToken!,
  };
}

export async function registerUser(email: string, password: string, name: string, role: UserRole): Promise<string> {
  const signUpCommand = new SignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'name', Value: name },
      { Name: 'custom:role', Value: role },
    ],
  });

  const response = await cognitoClient.send(signUpCommand);
  
  if (response.UserSub) {
    const groupCommand = new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      GroupName: role,
    });
    await cognitoClient.send(groupCommand);
  }

  return response.UserSub || '';
}

export async function getUserFromToken(accessToken: string) {
  const command = new GetUserCommand({
    AccessToken: accessToken,
  });

  const response = await cognitoClient.send(command);
  
  const attributes: Record<string, string> = {};
  response.UserAttributes?.forEach(attr => {
    if (attr.Name && attr.Value) {
      attributes[attr.Name] = attr.Value;
    }
  });

  return {
    sub: attributes.sub,
    email: attributes.email,
    name: attributes.name,
    role: (attributes['custom:role'] || 'PATIENT') as UserRole,
  };
}
