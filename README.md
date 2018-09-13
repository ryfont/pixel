Single pixel debate game
========================

Code for the debate game hosted at https://debate-game.openai.com.  Go there
for game instructions or to play it.  For more details and motivation, see the
[blog post](https://blog.openai.com/debate) or
[paper](https://arxiv.org/abs/1805.00899).

The website is hosted on Firebase.  It's [MIT licensed](LICENSE), so feel free
to clone and tweak, though you'll have to make your own Firebase project in
order to run a copy.  PRs to make that easier are welcome!

The image search feature uses a Flickr API key.  If you want to host a copy of
the site, you'll need to get your own key or use a different mechanism to pick
images.

## Instructions

    npm install
    npm run dev
    open http://localhost:3000

## Deploying

    npm run fb login
    npm run deploy

## Firebase database

We use a Firebase Realtime Database to manage games.  The ground truth schema
is only stored in Firebase, but see [database.md](database.md) for a copy.
Please file an issue if that file appears to be out of date.
