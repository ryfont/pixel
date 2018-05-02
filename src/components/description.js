import m from 'mithril'

export function short_description (link) {
  return m('.col.gap-2', [
    m('h1', 'Debate Game'),
    m('p', ['The single pixel debate game is played between two debaters and a judge.  One debater tells the truth, the other lies.  An image is visible to the two debaters, and they can draw rectangles on the image and talk to the judge.  The judge sees only the rectangles: the image is hidden.  Each debater is also allowed to reveal a single pixel to the judge.  The pixel must be chosen carefully, since they can only reveal one pixel total over the whole debate.']
           .concat(link ? ['  ', m('a', {href: '/'}, 'Detailed instructions.')] : [])
    ),
  ])
}

export function long_description () {
  return m('.col.gap-2.long-description', [
    m('h1', 'Background'),
    m('p', [
      'We built this website to test one aspect of the ',
      m('a', {href: 'https://blog.openai.com/debate'}, 'debate approach to AI alignment'), '. ',
      'Our hypothesis is that good play in an adversarial game between two debaters ',
      'can produce honest behavior, even if the agents know much more than the judge. ',
      "Even in the single pixel version described here, we've found informally that the honest player ",
      'wins most of the time (though not always).  We are curious what others will find.'
    ]),
    m('div', {'class': 'cargo-cult'}, [
      m('img', {src: '/debate-game-animation_4-26c.gif', width: 655, 'class': 'beagle'}),
    ]),
    m('h1', 'Instructions'),
    m('p', 'Here are example instructions, assuming three players in the same room:'),
    m('ol', [
      m('li', 'One person clicks "Create New Game", and shares the link with two others.'),
      m('li', 'They pick a topic, such as “cats vs. dogs”.'),
      m('li', 'Two people click “Become a Debater”, and one of them selects an image by entering keywords for image search or an explicit link.'),
      m('li', 'The debaters use the “Flip Coin” button to choose who lies.'),
      m('li', 'The debaters spend 30 seconds silently planning their strategy.'),
      m('li', 'The debaters make their claims about the image (“cat” or “dog”), then spend 5 minutes talking and drawing rectangles on the image, trying to convince the judge they are telling the truth.  The judge can also ask questions.  The debaters should take turns, restrict themselves to short statements, and not talk too fast (otherwise, the honest player wins too easily).  Except for the initial claim by the honest player, both debaters can lie whenever it is useful to convince the judge.  (It is an interesting question whether lies by the honest player are useful.)'),
      m('li', 'Each debater can use "Reveal Pixel" only once throughout the game to reveal the true value of one pixel to the judge. Choose your pixel wisely!'),
      m('li', 'The judge decides who is telling the truth, then clicks “Reveal Image” to check.'),
      m('li', 'To start a new round with the same players, click “Reset Board & Roles”.'),
    ]),
    m('p', ['The website does not enforce the rules above, and we encourage people to explore different variants. ',
            'Here are a few examples:']),
    m('ul', [
      m('li', [m('b', 'Different communication channel: '), 'Is text debate different than talking?']),
      m('li', [m('b', 'No theme: '), 'The judge decides who gave the most true, useful information.']),
      m('li', [m('b', 'Silent judge: '), 'The judge cannot speak until they make their decision.']),
      m('li', [m('b', 'Hard mode: '),
               'The judge closes their eyes, and debaters read rectangle coordinates out loud.']),
    ]),
    m('p', 'Have fun debating!'),
  ])
}
