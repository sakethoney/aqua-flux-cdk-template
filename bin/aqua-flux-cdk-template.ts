#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AquaFluxCdkTemplateStack } from '../lib/aqua-flux-cdk-template-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};
new AquaFluxCdkTemplateStack(app, 'AquaFluxCdkTemplateStack', {env});