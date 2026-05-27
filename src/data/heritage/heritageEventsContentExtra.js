/** Événements chronologie — contenus additionnels (FR / EN) */

function ev(titleKey, year, heroAltKey, frTexts, enTexts) {
  return {
    titleKey,
    year,
    heroAltKey,
    blocks: {
      fr: frTexts.map((text) => ({ type: 'p', text })),
      en: enTexts.map((text) => ({ type: 'p', text })),
    },
  };
}

export const HERITAGE_EVENTS_EXTRA = {
  'nero-persecution': ev(
    'heritage_event_nero_title',
    '64',
    'heritage_img_nero_alt',
    [
      'Sous Néron, après l\'incendie de Rome (64), des chrétiens sont persécutés — tradition ancienne (Tacite, Suetone). C\'est l\'une des premières persécutions impériales documentées.',
      'Les témoins païens confirment l\'existence d\'une communauté identifiable « christianorum » haïe par la foule. Pierre et Paul meurent vraisemblablement à Rome durant cette période (tradition, non détail archéologique direct).',
      'La persécution ne détruit pas l\'Église : elle répand la foi par le témoignage des martyrs.',
    ],
    [
      'Under Nero, after Rome\'s fire (AD 64), Christians were persecuted — ancient tradition (Tacitus, Suetonius). This is among the first documented imperial persecutions.',
      'Pagan witnesses confirm a distinct community hated as "Christians." Peter and Paul likely die in Rome in this period (tradition, not direct archaeology).',
      'Persecution does not destroy the Church: it spreads faith through martyrs\' witness.',
    ],
  ),
  'constantine-legalization': ev(
    'heritage_event_milan_title',
    '313',
    'heritage_img_constantine_alt',
    [
      'L\'édit de Milan (313) accorde la liberté de culte aux chrétiens dans l\'Empire romain. Constantin favorise ensuite le christianisme sans en faire immédiatement la religion d\'État unique.',
      'Ce tournant politique permet la construction d\'églises, la fin des persécutions d\'État et la convocation du concile de Nicée (325).',
      'Les historiens débattent des motivations de Constantin (vision, politique, sincérité) — le fait historique de la tolérance légale reste central.',
    ],
    [
      'The Edict of Milan (313) grants Christians freedom of worship in the Roman Empire. Constantine later favors Christianity without immediately making it the sole state religion.',
      'This political turn allows church building, end of state persecution, and the Council of Nicaea (325).',
      'Historians debate Constantine\'s motives — the legal tolerance remains a central historical fact.',
    ],
  ),
  'constantinople-381': ev(
    'heritage_event_constantinople_title',
    '381',
    'heritage_img_constantinople_alt',
    [
      'Le premier concile de Constantinople (381) affirme la divinité du Saint-Esprit et complète le Symbole de Nicée. Le christianisme devient religion officielle de l\'Empire sous Théodose I.',
      'Les Pères capadociens (Basile, Grégoire de Nazianze, Grégoire de Nysse) clarifient la doctrine trinitaire face aux hérésies.',
    ],
    [
      'The First Council of Constantinople (381) affirms the Holy Spirit\'s divinity and completes the Nicene Creed. Christianity becomes the Empire\'s official religion under Theodosius I.',
      'The Cappadocian Fathers clarify Trinitarian doctrine against heresies.',
    ],
  ),
  'ephesus-431': ev(
    'heritage_event_ephesus_title',
    '431',
    'heritage_img_ephesus_alt',
    [
      'Le concile d\'Éphèse (431) proclame Marie « Mère de Dieu » (Theotokos) et condamne le nestorianisme, qui séparait trop la nature humaine du Christ.',
      'Cyrille d\'Alexandrie et les moines égyptiens jouent un rôle majeur. Le concile illustre les débats christologiques intenses du IVe-Ve siècle.',
    ],
    [
      'The Council of Ephesus (431) proclaims Mary "Mother of God" (Theotokos) and condemns Nestorianism, which separated Christ\'s humanity too sharply.',
      'Cyril of Alexandria and Egyptian monks play a major role, illustrating intense 4th-5th century Christological debate.',
    ],
  ),
  'fall-rome-476': ev(
    'heritage_event_rome476_title',
    '476',
    'heritage_img_rome476_alt',
    [
      'La déposition du dernier empereur romain d\'Occident (476) symbolise la fin de l\'Antiquité classique. L\'Église occidentale devient cadre de stabilité culturelle et morale.',
      'Augustin avait déjà proposé dans La Cité de Dieu une lecture théologique : deux cités, l\'une terrestre, l\'une céleste.',
      'Les missionnaires irlandais et continentaux prépareront la conversion des peuples germaniques.',
    ],
    [
      'Deposition of the last Western Roman emperor (476) symbolizes the end of classical antiquity. The Western Church becomes a framework for cultural and moral stability.',
      'Augustine\'s City of God already offered a theological reading: two cities, earthly and heavenly.',
      'Irish and continental missionaries will prepare conversion of Germanic peoples.',
    ],
  ),
  'gregory-great': ev(
    'heritage_event_gregory_title',
    '590',
    'heritage_img_gregory_alt',
    [
      'Grégoire I (pape 590-604) organise la pastorale, la liturgie et la mission : envoi d\'Augustin vers les Anglo-Saxons (597). On le surnomme « le Grand » et « père des pauvres ».',
      'Il consolide l\'autorité pontificale en Occident face aux invasions lombardes et affirme la responsabilité de l\'Église envers les nécessiteux.',
    ],
    [
      'Gregory I (pope 590-604) organizes pastoral care, liturgy, and mission: sending Augustine to the Anglo-Saxons (597). Called "the Great" and "father of the poor."',
      'He consolidates papal authority in the West against Lombard invasions and affirms the Church\'s care for the needy.',
    ],
  ),
  charlemagne: ev(
    'heritage_event_charlemagne_title',
    '800',
    'heritage_img_charlemagne_alt',
    [
      'Le couronnement impérial de Charlemagne (Noël 800) unifie foi et pouvoir en Occident. La « renaissance carolingienne » copie et transmet les manuscrits bibliques et patristiques.',
      'L\'école palatine favorise l\'éducation du clergé. L\'Europe chrétienne médiévale prend forme autour de l\'Église et de l\'Empire.',
    ],
    [
      'Charlemagne\'s imperial coronation (Christmas 800) unites faith and power in the West. The "Carolingian renaissance" copies and transmits biblical and patristic manuscripts.',
      'The palace school educates clergy. Medieval Christian Europe takes shape around Church and Empire.',
    ],
  ),
  crusades: {
    titleKey: 'heritage_event_crusades_title',
    year: '1095',
    heroAltKey: 'heritage_img_crusades_alt',
    blocks: {
      fr: [
        { type: 'p', text: 'En 1095, Urbain II appelle à la libération de Jérusalem. Les croisades mélangent piété, aventure, intérêts politiques et violence — y compris contre les Juifs d\'Europe et parfois les chrétiens d\'Orient.' },
        { type: 'p', text: 'Les historiens chrétiens, musulmans et laïcs documentent ces événements. L\'Église contemporaine reconnaît les excès et appelle à la repentance et au dialogue interreligieux.' },
        { type: 'p', text: 'Comprendre les croisades honnêtement renforce une foi qui refuse le triumphalisme aveugle.' },
      ],
      en: [
        { type: 'p', text: 'In 1095 Urban II calls for Jerusalem\'s liberation. Crusades mix piety, adventure, politics, and violence — including against European Jews and sometimes Eastern Christians.' },
        { type: 'p', text: 'Christian, Muslim, and secular historians document these events. The contemporary Church acknowledges excesses and calls for repentance and interfaith dialogue.' },
        { type: 'p', text: 'Honest understanding of the Crusades strengthens faith that refuses blind triumphalism.' },
      ],
    },
  },
  'western-schism': ev(
    'heritage_event_western_schism_title',
    '1378',
    'heritage_img_western_schism_alt',
    [
      'De 1378 à 1417, deux puis trois papes rivaux se réclament de Rome ou d\'Avignon. La crise ébranle l\'autorité pontificale et nourrit les critiques (Wyclif, Hus) qui préparent la Réforme.',
      'Le concile de Constance (1414-1418) rétablit l\'unité et condamne Hus — tension entre réforme nécessaire et répression.',
    ],
    [
      'From 1378 to 1417, two then three rival popes claim Rome or Avignon. The crisis shakes papal authority and feeds critics (Wyclif, Hus) preparing the Reformation.',
      'The Council of Constance (1414-1418) restores unity and condemns Hus — tension between needed reform and repression.',
    ],
  ),
  'fall-constantinople': ev(
    'heritage_event_1453_title',
    '1453',
    'heritage_img_1453_alt',
    [
      'La chute de Constantinople (29 mai 1453) met fin à l\'Empire byzantin. Les érudits grecs fuient vers l\'Italie, contribuant à la Renaissance ; les Églises d\'Orient vivent sous domination ottomane.',
      'Pour l\'Occident, c\'est aussi le choc qui pousse à repenser l\'unité chrétienne et la mission.',
    ],
    [
      'Fall of Constantinople (May 29, 1453) ends the Byzantine Empire. Greek scholars flee to Italy, fueling the Renaissance; Eastern churches live under Ottoman rule.',
      'For the West it also shocks Christians into rethinking unity and mission.',
    ],
  ),
  'printing-reformation': ev(
    'heritage_event_printing_title',
    '1455',
    'heritage_img_printing_alt',
    [
      'L\'imprimerie à caractères mobiles (Gutenberg, vers 1455) démocratise l\'accès aux textes. La Bible imprimée devient le livre le plus diffusé en Europe.',
      'Un siècle plus tard, Luther et les réformateurs s\'appuient sur cette technologie pour diffuser Écritures et traités dans les langues vernaculaires.',
    ],
    [
      'Movable-type printing (Gutenberg, c. 1455) democratizes access to texts. The printed Bible becomes Europe\'s most widely distributed book.',
      'A century later Luther and reformers use this technology to spread Scripture and treatises in vernacular languages.',
    ],
  ),
  'zwingli-reform': ev(
    'heritage_event_zwingli_title',
    '1523',
    'heritage_img_zwingli_alt',
    [
      'Ulrich Zwingli réforme Zurich dès 1519-1523 : prédication biblique continue, suppression des images, messe transformée. La Réforme suisse diffère de Luther sur l\'Eucharistie (mémorial vs présence réelle).',
      'Les cantons protestants et catholiques s\'affrontent (bataille de Kappel, 1531).',
    ],
    [
      'Ulrich Zwingli reforms Zurich from 1519-1523: continuous biblical preaching, removal of images, transformed mass. Swiss Reformation differs from Luther on the Eucharist (memorial vs real presence).',
      'Protestant and Catholic cantons clash (Battle of Kappel, 1531).',
    ],
  ),
  'anabaptist-reform': ev(
    'heritage_event_anabaptist_title',
    '1525',
    'heritage_img_anabaptist_alt',
    [
      'À Zurich (1525), des disciples de Zwingli pratiquent le baptême des croyants adultes — naissance du mouvement anabaptiste. Ils rejettent la fusion Église-État et l\'usage de la contrainte politique.',
      'Persécutés par catholiques et protestants, ils influencent les baptistes, mennonites et brüder. Leur témoignage de non-violence et de fidélité biblique reste marquant.',
    ],
    [
      'In Zurich (1525), Zwingli\'s followers practice believer\'s baptism — birth of the Anabaptist movement. They reject church-state fusion and political coercion.',
      'Persecuted by Catholics and Protestants, they influence Baptists, Mennonites, and Brethren. Their nonviolence and biblical fidelity remain striking.',
    ],
  ),
  'calvin-geneva': ev(
    'heritage_event_calvin_title',
    '1536',
    'heritage_img_calvin_alt',
    [
      'Jean Calvin publie l\'Institution chrétienne (1536) et organise Genève comme « ville-séminaire » : gouvernance par les anciens, discipline morale, éducation, mission.',
      'La tradition réformée (presbytérienne, huguenote, scots) diffuse sa théologie de la souveraineté de Dieu, de la prédestination et de la vocation dans le monde.',
    ],
    [
      'John Calvin publishes the Institutes (1536) and organizes Geneva as a "seminary city": rule by elders, moral discipline, education, mission.',
      'Reformed tradition (Presbyterian, Huguenot, Scots) spreads his theology of God\'s sovereignty, election, and vocation in the world.',
    ],
  ),
  'english-reformation': ev(
    'heritage_event_english_ref_title',
    '1534',
    'heritage_img_henry_alt',
    [
      'Henri VIII rompt avec Rome (Acte de Suprématie, 1534) pour des raisons dynastiques autant que théologiques. L\'Église d\'Angleterre naît sous contrôle royal.',
      'Plus tard, sous Élisabeth I, un anglicanisme modéré émerge ; les puritains poussent vers une Réforme plus protestante. Tyndale avait déjà traduit le NT en anglais (1526).',
    ],
    [
      'Henry VIII breaks with Rome (Act of Supremacy, 1534) for dynastic as much as theological reasons. The Church of England is born under royal control.',
      'Later, under Elizabeth I, moderate Anglicanism emerges; Puritans push for fuller Protestant reform. Tyndale had already translated the NT into English (1526).',
    ],
  ),
  'council-trent': ev(
    'heritage_event_trent_title',
    '1545',
    'heritage_img_trent_alt',
    [
      'Le concile de Trente (1545-1563) définit la réponse catholique à la Réforme : clarification doctrinale, réforme des mœurs, formation du clergé, affirmation du canon biblique et de la tradition.',
      'Naissance de la Contre-Réforme : Jésuites (Ignace de Loyola), nouvelles ordres, art baroque, missions en Amérique et en Asie.',
      'Le schisme chrétien occidental devient structurel — dialogue œcuménique seulement au XXe siècle.',
    ],
    [
      'The Council of Trent (1545-1563) defines Catholic response to the Reformation: doctrinal clarity, moral reform, clergy training, affirmation of biblical canon and tradition.',
      'Birth of Counter-Reformation: Jesuits (Ignatius), new orders, baroque art, missions in Americas and Asia.',
      'Western Christian schism becomes structural — ecumenical dialogue only in the 20th century.',
    ],
  ),
  'great-awakening': ev(
    'heritage_event_awakening_title',
    '1730',
    'heritage_img_awakening_alt',
    [
      'Le Grand Réveil (années 1730-1740) en Amérique et en Angleterre : prédication en plein air (Whitefield, Wesley, Edwards), conversions de masse, insistance sur la nouvelle naissance.',
      'Il prépare l\'évangélisme moderne, les missions et, indirectement, les valeurs de la Révolution américaine — tout en suscitant aussi des excès et des critiques rationnelles.',
    ],
    [
      'The Great Awakening (1730s-1740s) in America and England: open-air preaching (Whitefield, Wesley, Edwards), mass conversions, stress on new birth.',
      'It prepares modern evangelicalism, missions, and indirectly American Revolution values — while also provoking excesses and rationalist criticism.',
    ],
  ),
  'vatican-i': ev(
    'heritage_event_vatican1_title',
    '1870',
    'heritage_img_vatican_alt',
    [
      'Vatican I (1869-1870) proclame l\'infaillibilité pontificale en matière de foi et de mœurs (définitions ex cathedra) et la juridiction ordinaire du pape sur toute l\'Église.',
      'Les « ultramontains » triomphent ; les « gallicans » et libéraux catholiques résistent. Le dogme marque la centralisation romaine avant Vatican II.',
    ],
    [
      'Vatican I (1869-1870) proclaims papal infallibility on faith and morals (ex cathedra definitions) and the pope\'s ordinary jurisdiction over the whole Church.',
      'Ultramontanists triumph; Gallicans and liberal Catholics resist. The dogma marks Roman centralization before Vatican II.',
    ],
  ),
  'vatican-ii': ev(
    'heritage_event_vatican2_title',
    '1962',
    'heritage_img_vatican2_alt',
    [
      'Vatican II (1962-1965) ouvre l\'Église catholique : liturgie en langue vernaculaire, estime des autres chrétiens et des religions, liberté religieuse, rôle des laïcs.',
      'Documents clés : Lumen gentium, Dei Verbum, Nostra aetate, Gaudium et spes. Réforme liturgique et pastorale — interprétations « progressistes » et « traditionalistes » coexistent depuis.',
    ],
    [
      'Vatican II (1962-1965) opens the Catholic Church: vernacular liturgy, esteem for other Christians and religions, religious liberty, laity\'s role.',
      'Key documents: Lumen gentium, Dei Verbum, Nostra aetate, Gaudium et spes. Liturgical and pastoral reform — progressive and traditionalist readings coexist since.',
    ],
  ),
};
