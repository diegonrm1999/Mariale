import { registerAs } from '@nestjs/config';

export default registerAs('ses', () => ({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  fromEmail: process.env.AWS_SES_FROM_EMAIL,
  fromName: process.env.AWS_SES_FROM_NAME,
}));