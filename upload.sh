#!/usr/bin/env bash
# Builds bookmarklets.html and replaces the copy served at https://developers.limberhealth.com/bookmarklets.html.
# Logs in to AWS SSO only when the session for the profile has expired.
set -euo pipefail
cd "$(dirname "$0")"

PROFILE="prod-v2"
BUCKET="developers.limberhealth.com"
KEY="bookmarklets.html"

npm run build --silent

if ! aws sts get-caller-identity --profile "$PROFILE" >/dev/null 2>&1; then
  echo "AWS SSO session for profile $PROFILE needs a login."
  aws sso login --profile "$PROFILE"
fi

aws s3 cp "$KEY" "s3://$BUCKET/$KEY" --profile "$PROFILE" --content-type "text/html; charset=utf-8"
echo "Replaced https://$BUCKET/$KEY"
