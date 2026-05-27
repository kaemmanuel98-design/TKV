/** Événements chronologie — contenu détaillé */
import { HERITAGE_EVENTS_EXTRA } from './heritageEventsContentExtra.js';

export const HERITAGE_EVENTS_CONTENT = {
  'crucifixion-resurrection': {
    titleKey: 'heritage_event_resurrection_title',
    year: '30',
    heroAltKey: 'heritage_img_resurrection_event_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'Vers l\'an 30, Jésus de Nazareth est crucifié à Jérusalem sous Ponce Pilate. Trois jours plus tard, selon le témoignage unanime des premiers disciples, il est annoncé ressuscité. Cet événement devient le pivot de l\'histoire mondiale pour des milliards de personnes.' },
        { type: 'h2', text: 'Contexte historique' },
        { type: 'p', text: 'La Judée est une province romaine sensible. Jésus est arrêté après la Cène, jugé par les autorités religieuses puis remis à Pilate. La crucifixion est une mort infamante ; pour des Juifs messianiques, elle semble d\'abord un échec total.' },
        { type: 'h2', text: 'Ce qui change tout' },
        { type: 'p', text: 'Les femmes découvrent le tombeau vide. Pierre et Jean courent voir. Des apparitions se multiplient à Jérusalem, en Galilée, sur le chemin d\'Emmaüs. En cinquante jours, ces disciples timides prêcheront publiquement la résurrection à la Pentecôte.' },
        { type: 'quote', text: '« Il n\'est pas ici ; il est ressuscité. »', source: 'Luc 24,6' },
      ],
      en: [
        { type: 'p', text: 'Around AD 30, Jesus of Nazareth is crucified in Jerusalem under Pontius Pilate. Three days later, according to the unanimous testimony of the first disciples, he is proclaimed risen. This event becomes the pivot of world history for billions of people.' },
        { type: 'h2', text: 'Historical context' },
        { type: 'p', text: 'Judea is a sensitive Roman province. Jesus is arrested after the Last Supper, tried by religious authorities, then handed to Pilate. Crucifixion is an infamous death; for Jewish messianic hopes it first looks like total failure.' },
        { type: 'h2', text: 'What changes everything' },
        { type: 'p', text: 'Women find the empty tomb. Peter and John run to see. Appearances multiply in Jerusalem, Galilee, on the Emmaus road. Within fifty days these timid disciples will publicly preach resurrection at Pentecost.' },
        { type: 'quote', text: '"He is not here; he has risen."', source: 'Luke 24:6' },
      ],
    },
  },
  pentecost: {
    titleKey: 'heritage_event_pentecost_title',
    year: '33',
    heroAltKey: 'heritage_img_pentecost_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'Cinquante jours après Pâques, à Jérusalem, le Saint-Esprit descend sur les disciples rassemblés. Pierre prêche : trois mille personnes se convertissent en un jour. L\'Église, corps du Christ, naît dans la puissance et la mission.' },
        { type: 'h2', text: 'Signes et portée' },
        { type: 'p', text: 'Des langues de feu, le don des langues pour proclamer les merveilles de Dieu, la communion fraternelle, les miracles : Actes 2 décrit une communauté radicalement nouvelle. La Pentecôte n\'est pas une fête folklorique mais l\'origine de l\'expansion mondiale du christianisme.' },
        { type: 'list', items: [
          'Naissance visible de l\'Église apostolique',
          'Premier grand sermon de Pierre (Actes 2)',
          'Modèle de réveil : Parole, Esprit, mission',
        ]},
        { type: 'img', altKey: 'heritage_img_pentecost_alt', captionKey: 'heritage_img_pentecost_cap' },
      ],
      en: [
        { type: 'p', text: 'Fifty days after Easter, in Jerusalem, the Holy Spirit descends on gathered disciples. Peter preaches: three thousand convert in one day. The Church, Christ\'s body, is born in power and mission.' },
        { type: 'h2', text: 'Signs and scope' },
        { type: 'p', text: 'Tongues of fire, gift of languages to proclaim God\'s wonders, fellowship, miracles: Acts 2 describes a radically new community. Pentecost is not folklore but the origin of Christianity\'s global expansion.' },
        { type: 'list', items: [
          'Visible birth of the apostolic Church',
          'Peter\'s first great sermon (Acts 2)',
          'Revival pattern: Word, Spirit, mission',
        ]},
        { type: 'img', altKey: 'heritage_img_pentecost_alt', captionKey: 'heritage_img_pentecost_cap' },
      ],
    },
  },
  'jerusalem-70': {
    titleKey: 'heritage_event_70_title',
    year: '70',
    heroAltKey: 'heritage_img_70_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'En 70, l\'armée romaine de Titus détruit le temple de Jérusalem. Cet événement bouleverse le judaïsme et confirme, pour les chrétiens, les avertissements de Jésus sur le temple (Marc 13, Luc 21).' },
        { type: 'p', text: 'L\'Église, déjà tournée vers les nations grâce à Paul, se distingue davantage du judaïsme temple-centré. Le christianisme devient une foi mondiale sans sacrifice à Jérusalem — tout en gardant ses racines hébraïques.' },
        { type: 'h2', text: 'Conséquences durables' },
        { type: 'list', items: [
          'Fin du culte sacrificiel au temple',
          'Dispersion (diaspora) juive renforcée',
          'Séparation progressive synagogue / Église',
        ]},
      ],
      en: [
        { type: 'p', text: 'In AD 70, Titus\'s Roman army destroys the Jerusalem temple. This upheaves Judaism and, for Christians, confirms Jesus\' warnings about the temple (Mark 13, Luke 21).' },
        { type: 'p', text: 'The Church, already turning to the nations through Paul, distinguishes itself further from temple-centered Judaism. Christianity becomes a world faith without sacrifice in Jerusalem — while keeping its Hebrew roots.' },
        { type: 'h2', text: 'Lasting consequences' },
        { type: 'list', items: [
          'End of sacrificial worship at the temple',
          'Strengthened Jewish diaspora',
          'Gradual synagogue/Church separation',
        ]},
      ],
    },
  },
  nicaea: {
    titleKey: 'heritage_event_nicaea_title',
    year: '325',
    heroAltKey: 'heritage_img_nicaea_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'L\'empereur Constantin convoque en 325 à Nicée (actuelle Turquie) le premier grand concile œcuménique. Environ 300 évêques débattent de la divinité du Christ face à l\'arianisme, qui présentait Jésus comme une créature supérieure.' },
        { type: 'h2', text: 'Le Symbole de Nicée' },
        { type: 'p', text: 'Le concile affirme que le Fils est « de même substance » (homoousios) que le Père — pleinement Dieu. Ce texte, enrichi plus tard, structure encore la foi de millions de chrétiens catholiques, orthodoxes et protestants.' },
        { type: 'quote', text: '« Dieu de Dieu, Lumière de Lumière, vrai Dieu de vrai Dieu… »', source: 'Symbole de Nicée-Constantinople' },
        { type: 'img', altKey: 'heritage_img_nicaea_alt', captionKey: 'heritage_img_nicaea_cap' },
      ],
      en: [
        { type: 'p', text: 'Emperor Constantine convenes the first great ecumenical council at Nicaea (modern Turkey) in AD 325. About 300 bishops debate Christ\'s divinity against Arianism, which treated Jesus as a high creature.' },
        { type: 'h2', text: 'The Nicene Creed' },
        { type: 'p', text: 'The council affirms the Son is "of one substance" (homoousios) with the Father — fully God. This text, later expanded, still structures faith for millions of Catholic, Orthodox, and Protestant Christians.' },
        { type: 'quote', text: '"God from God, Light from Light, true God from true God…"', source: 'Nicene-Constantinopolitan Creed' },
        { type: 'img', altKey: 'heritage_img_nicaea_alt', captionKey: 'heritage_img_nicaea_cap' },
      ],
    },
  },
  chalcedon: {
    titleKey: 'heritage_event_chalcedon_title',
    year: '451',
    heroAltKey: 'heritage_img_chalcedon_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'Le concile de Chalcédoine (451) définit la christologie classique : en Jésus-Christ, une seule personne divine existe en deux natures — divine et humaine — « sans confusion, sans changement, sans division, sans séparation ».' },
        { type: 'p', text: 'Cette formule répond aux extrêmes : le nestorianisme (deux personnes) et le monophysisme (une seule nature). Des Églises orientales ne reçoivent pas Chalcédoine : le schisme miophysite marque encore le Moyen-Orient.' },
        { type: 'h2', text: 'Héritage aujourd\'hui' },
        { type: 'p', text: 'Comprendre Chalcédoine aide à saisir pourquoi les chrétiens croient que le Dieu transcendant a vraiment souffert sur la croix — en tant qu\'homme, sans cesser d\'être Dieu.' },
      ],
      en: [
        { type: 'p', text: 'The Council of Chalcedon (AD 451) defines classic Christology: in Jesus Christ one divine person exists in two natures — divine and human — "without confusion, change, division, or separation."' },
        { type: 'p', text: 'This formula answers extremes: Nestorianism (two persons) and Monophysitism (one nature). Some Eastern churches did not receive Chalcedon: the Miaphysite schism still marks the Middle East.' },
        { type: 'h2', text: 'Legacy today' },
        { type: 'p', text: 'Understanding Chalcedon helps grasp why Christians believe the transcendent God truly suffered on the cross — as man, without ceasing to be God.' },
      ],
    },
  },
  'great-schism': {
    titleKey: 'heritage_event_schism_title',
    year: '1054',
    heroAltKey: 'heritage_img_schism_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'En 1054, les excommunications entre Rome et Constantinople symbolisent une coupure durable : l\'Église d\'Occident (catholique romaine) et l\'Église d\'Orient (orthodoxe) suivent des chemins séparés, tout en partageant les conciles anciens et les Écritures.' },
        { type: 'h2', text: 'Causes profondes' },
        { type: 'list', items: [
          'Différences liturgiques et linguistiques (latin / grec)',
          'Autorité du pape vs patriarches',
          'Filioque (Esprit Saint procède-t-il aussi du Fils ?)',
          'Politique byzantine et invasions',
        ]},
        { type: 'p', text: 'Le schisme n\'efface pas la communion spirituelle de millions de croyants. Les dialogues œcuméniques du XXe siècle ont avancé la reconnaissance mutuelle et la prière commune.' },
      ],
      en: [
        { type: 'p', text: 'In 1054, mutual excommunications between Rome and Constantinople symbolize lasting division: the Western (Roman Catholic) and Eastern (Orthodox) churches follow separate paths while sharing ancient councils and Scripture.' },
        { type: 'h2', text: 'Deep causes' },
        { type: 'list', items: [
          'Liturgical and linguistic differences (Latin / Greek)',
          'Papal authority vs patriarchs',
          'Filioque (does the Spirit proceed from the Son too?)',
          'Byzantine politics and invasions',
        ]},
        { type: 'p', text: 'The schism does not erase spiritual kinship among millions of believers. Twentieth-century ecumenical dialogues advanced mutual recognition and common prayer.' },
      ],
    },
  },
  reformation: {
    titleKey: 'heritage_event_reform_title',
    year: '1517',
    heroAltKey: 'heritage_img_luther_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'Le 31 octobre 1517, Martin Luther affiche ses 95 thèses à Wittenberg (Saxe). Il proteste contre la vente d\'indulgences et rappelle que la justification s\'obtient par la foi seule, par grâce seule, selon les Écritures seules (sola fide, sola gratia, sola scriptura).' },
        { type: 'h2', text: 'Portée de la Réforme' },
        { type: 'list', items: [
          'Traduction de la Bible en langue vernaculaire (allemand, puis autres)',
          'Fin du monopole latin en Occident',
          'Naissance des Églises protestantes (luthérienne, réformée, anglicane…)',
          'Renouveau catholique (Contre-Réforme, concile de Trente)',
        ]},
        { type: 'p', text: 'La Réforme n\'est pas seulement un divorce : c\'est un appel au retour aux sources évangéliques. TKV se situe dans cet héritage biblique partagé par catholiques, orthodoxes et protestants.' },
        { type: 'img', altKey: 'heritage_img_luther_alt', captionKey: 'heritage_img_luther_cap' },
      ],
      en: [
        { type: 'p', text: 'On October 31, 1517, Martin Luther posts his 95 Theses at Wittenberg. He protests indulgence sales and recalls justification by faith alone, by grace alone, according to Scripture alone (sola fide, sola gratia, sola scriptura).' },
        { type: 'h2', text: 'Scope of the Reformation' },
        { type: 'list', items: [
          'Bible translation into vernacular languages',
          'End of Latin monopoly in the West',
          'Birth of Protestant churches (Lutheran, Reformed, Anglican…)',
          'Catholic renewal (Counter-Reformation, Council of Trent)',
        ]},
        { type: 'p', text: 'The Reformation is not only division: it is a call back to Gospel sources. TKV stands in this biblical heritage shared by Catholics, Orthodox, and Protestants.' },
        { type: 'img', altKey: 'heritage_img_luther_alt', captionKey: 'heritage_img_luther_cap' },
      ],
    },
  },
  azusa: {
    titleKey: 'heritage_event_azusa_title',
    year: '1906',
    heroAltKey: 'heritage_img_azusa_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'De 1906 à 1909, une ancienne église méthodiste du 312 Azusa Street à Los Angeles devient le centre d\'un réveil marqué par la prière, les langues, la guérison et l\'unité interraciale rare pour l\'époque.' },
        { type: 'h2', text: 'William J. Seymour' },
        { type: 'p', text: 'Pasteur afro-américain, élève de Charles Parham, Seymour prêche que la Pentecôte de Actes 2 doit se poursuivre aujourd\'hui. Des missionnaires partent vers le Mexique, l\'Europe, l\'Afrique et l\'Asie : naissance du pentecôtisme mondial moderne.' },
        { type: 'list', items: [
          'Plus de 500 millions de pentecôtistes / charismatiques aujourd\'hui',
          'Influence sur les mouvements de réveil mondiaux',
          'Héritage spirituel proche de la vision TKV : Esprit, Parole, mission',
        ]},
        { type: 'img', altKey: 'heritage_img_azusa_alt', captionKey: 'heritage_img_azusa_cap' },
      ],
      en: [
        { type: 'p', text: 'From 1906 to 1909, a former Methodist church at 312 Azusa Street, Los Angeles, becomes the center of a revival marked by prayer, tongues, healing, and rare interracial unity for its time.' },
        { type: 'h2', text: 'William J. Seymour' },
        { type: 'p', text: 'African American pastor, student of Charles Parham, Seymour teaches that Acts 2 Pentecost continues today. Missionaries leave for Mexico, Europe, Africa, and Asia: birth of modern global Pentecostalism.' },
        { type: 'list', items: [
          'Over 500 million Pentecostals / charismatics today',
          'Influence on global revival movements',
          'Spiritual heritage close to TKV vision: Spirit, Word, mission',
        ]},
        { type: 'img', altKey: 'heritage_img_azusa_alt', captionKey: 'heritage_img_azusa_cap' },
      ],
    },
  },
};

Object.assign(HERITAGE_EVENTS_CONTENT, HERITAGE_EVENTS_EXTRA);
