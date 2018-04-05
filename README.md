Single pixel debate game
========================

## Instructions

    npm install
    npm run build
    open build/index.html

## Deploying

    npm run fb login
    npm run deploy

## TODO

- [x] updating image should update immediately, not on reload
- [x] figure out solution for board resets, locking?
- [x] different liar each board reset
- [x] rectangles
- [ ] pixel reveal tool has bugs, should disable loupe always when judge, and errors if there is no image
- [x] only erase when clicking rectangle border
- [ ] better loupe, for both rectangle and pixel tool


- [ ] don't freeze on empty codes
- [ ] eraser processes click events on invisible fill
  - [ ] would be nice to indicate somehow what element is going to be deleted
- [ ] indicate firebase connection status to user:
- [ ] ask for confirmation when leaving game
- [ ] deal with conflicts for player selection, and add validation to firebase schema

```js
firebaseRef.child('.info/connected').on('value', function(connectedSnap) {
  if (connectedSnap.val() === true) {
    /* we're connected! */
  } else {
    /* we're disconnected! */
  }
});
```

from https://stackoverflow.com/questions/11351689/detect-if-firebase-connection-is-lost-regained

# Discussion

(Copied over from the Google doc)

This website tests one aspect of an approach to aligning ML systems stronger
than humans.  Our hypothesis is

* In a debate about what’s in an image, it’s very hard to lie even if only one
  pixel of the image is revealed to the judge of the debate.

This is related to aligned a strong ML system because we’re modeling “AI
stronger than human” with “debater with information the judge does not
possess.”

The site is a game with three players: two debaters and a judge (all humans:
there is no ML involved).  An image is chosen at random or manually and shown
to the debaters but not the judge.  The debaters have a short natural language
debate, possibly outside the website (they could be in the same room or use
chat).  The debaters can draw on the image, either freehand or by selecting
rectangles.  The judge sees what has been drawn but not the underlying image
(they see rectangles on a proxy, for example).  At the end, the judge decides
who won.

For example, say Alice and Bob debate whether an image is a cat or a dog: Alice
claims cat, Bob dog.  Alice points to a pixel and says “This is the cat’s green
eye.”  Bob cannot admit the pixel is an eye since dogs rarely have green eyes,
so he concocts a lie, “It's a dog playing in grass, and that's a blade of
grass.”  But this lie is hard to square with other facts: Alice replies “If it
were grass there were would be green above or below, but neither of these areas
is green.''  The debate continues until the agents focus in on a particular
pixel of disagreement, but where Bob is unable to invent a plausible counter,
at which point Alice reveals the pixel and wins.

We’ve played this game a number of times without tool support, but believe a
website where you can draw rectangles will make it much easier to play.  The
website will be released along with a technical paper describing the model,
both so that we can play the game ourselves a bunch and so that readers of the
paper can try it out too.  Some open design questions:

1. Ideal UI for 3 people to connect and choose an image (both random and manual
   selection would be good).  We do not want to enforce particular rules such as
   turn taking or scoring: rules are left up to the players so that difference
   variants can be tried easily.  For the same reason, we probably do not need
   user accounts.
2. Best method of drawing on the image.  I would expect freehand drawing may make
   the game even easier for an honest player, so rectangles may be fairer test of
   the model.
3. Do we need a server, or is something like Firebase/PubNub sufficient?  Simple
   is good, as long as it can reasonably scale with a burst of traffic when we
   publish the blog post.

As a bonus, it would be ideal if the website worked on mobile so that people
could play with their phones.  We are not sure if this is easy or hard.
