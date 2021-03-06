# big-board-webhooks

KA™ Big Board™-specific App Engine™-powered webhooks for extra super
fun'n'fancy Trello™ power

Right now all this automatically keeps
[big board](http://khanacademy.org/r/big-board) Trello card stickers up-to-date
as the cards are edited, listens for new projects being submitted to
new-projects@ka.org and automatically creates Trello<=>Google Doc links, and
maybe more to come.

![gif screenshot](https://raw.githubusercontent.com/Khan/big-board-webhooks/master/stickers.gif?token=AAGmqnghRKX1knCFMNlMEWNLrOsJeKPmks5VidA8wA%3D%3D)

## Warning

Manager Code™ lies here. Beware.

## Trello prerequisites

If using this at KA, all the following prerequisites are already setup for our
bigboard@khanacademy.org Trello account, which is a role account used
specifically to power these webhooks. That account's google password can be
found at: https://phabricator.khanacademy.org/K75

### Trello gold

You need an account w/ trello gold (or business class) enabled to be able to
upload custom stickers.

### Custom stickers

All of the sticker images found at stickers/\*.png need to be uploaded as
custom stickers for the Trello account being used below.

## Deployment

### First set up secrets

Start by copying secrets.py.example to secrets.py.

**You'll need to set the Trello API key in secrets.py:**
 1. Copy the password via 'show secret' at
    http://phabricator.khanacademy.org/K75
 2. Go to trello.com in an incognito window and log in using
    bigboard@khanacademy.org and the above password.
 3. Go to https://trello.com/app-key and grab the developer API key.

**You also need to set the oauth token in secrets.py.**
 1. Find it via 'show secret' at https://phabricator.khanacademy.org/K76.

Note that you can also regenerate an oauth token following the "getting your
    oauth token" steps at https://github.com/sarumont/py-trello. But you
    shouldn't have to do this unless somebody cleared the token, as the one
    stored in phabricator is set to never expire.

**Next add your Google service account's email to secrets.py...**
 1. Find it via 'show secret' at https://phabricator.khanacademy.org/K83.

**...and the same Google service account's PEM key to this repo's directory.**
 1. Find it via 'show secret' at https://phabricator.khanacademy.org/K85 and
    paste into a file called `khan-big-board-key.pem`.

Note that while the following is already taken care of for
    khan-big-board.appspot.com, if you are doing this for a new app and don't
    have access to the above secrets for a preconfig'd Google service account,
    you need to:
 1. Follow the instructions for "Creating a service account" at https://developers.google.com/api-client-library/python/auth/service-accounts.
 2. Follow the instructions for "Delegating domain-wide authority to the
    service account" at
    https://developers.google.com/identity/protocols/OAuth2ServiceAccount,
    providing domain-wide access to the Google Drive API. You'll need to use
    `https://www.googleapis.com/auth/drive` as the requested API Scope so
    these webhooks have access to Google Drive docs.
 3. Grab the account's email and P12 key from the Google Developers Console
 4. Convert the P12 key to PEM format (see http://stackoverflow.com/questions/27305867/google-api-access-using-service-account-oauth2client-client-cryptounavailableerr/27384087#27384087)



### Then deploy the Google Apps Script web service

This has already been done for Khan Academy and only needs to be done if
starting a new instance of big-board-webhooks or if the apps script needs
updating.

 1. Log in to https://script.google.com with the bigboard@khanacademy.org
 Google account (pass at http://phabricator.khanacademy.org/K75).
 2. Create a new blank project and paste the contents of
 `google_doc_app_script.gs` as its code. This script contains a web request
 handler that, when triggered, modifies Google Docs by adding Trello links to
 'em.)
 3. Publish ==> Deploy as web app. Choose "Execute the app as: Me" and "Who has
 access: Only myself." Click Update.
 4. Copy the published web app URL and use it as the value of
 `GOOGLE_SCRIPT_WEB_APP_PROD_URL` in google_drive.py.



### Now deploy the app

Log into the [App Engine console](http://appspot.com) for the khan-big-board
app (as prod-deploy@).

The password for that is here:
    https://phabricator.khanacademy.org/K43

Open the Versions tab to see what the current version is.
You can then deploy by ```cd'ing``` into this repo's directory and using

```
appcfg.py -A khan-big-board update . -V 9
```

where `9` is one more than the latest version.
After `appcfg.py` finishes, go ahead and flip the version in the
web interface to the one you just uploaded.

### And finally connect the webhooks

Now you should be able to hit {url-for-khan-big-board-app}/setup, which will
connect the Trello webhooks.

This is idempotent, so if it fails or if you're not sure if it's been run
before, feel free to run it again.

## Using the webhook

The webhook will automatically try to sync stickers w/ any card on big board
that has a string in its description matching ```||([GPRWY]+)||```, e.g.
```||GW||``` or ```||GPPGW||```.
All you have to do is update the card's description.

## Testing it

Go to [big board](http://khanacademy.org/r/big-board), add a new card, and edit
its description to include ```||GGPWW||```. If you see stickers start to appear
across the top of the card (green, green, purple, white, and white stickers to
be exact), then the webhook is working!

Or be professional and run unit tests:
`python testrunner.py ~/khan/webapp/third_party/frankenserver .`

### What to do if it doesn't work

Hold on to your hats, b/c this was written by a manager in a rare bit of free
time. Ask Kamens, and cross your fingers his brain hasn't forgotten everything!

