/**
 * Parcours EIDO — contenu détaillé et quiz d'évaluation (FR / EN).
 * Aligné sur le livre EIDO (Ange Emmanuel Kouamé) et les six piliers d'Hébreux 6.
 * Réparti dans Nepios (1–5), Neaniskos (6–9) et Teleios (10–13) via courseModules.js.
 */

function q(question, options, answer) {
  return { question, options, answer };
}

export const EIDO_COURSE_CONTENT = {
  1: {
    titleKey: 'module_e1_title',
    sections: {
      fr: [
        'La grâce n\'est pas une indulgence molle ni une permission de rester faible. Dans EIDO, la grâce apparaît dès le premier pilier — le renoncement aux œuvres mortes — parce qu\'elle révèle ce que Dieu fait là où l\'homme ne peut plus produire la vie par lui-même (Éphésiens 2:8-9 ; Tite 2:11-12).',
        'Charis (χάρις) signifie faveur imméritée, don royal, initiative divine. Ce n\'est pas d\'abord un sentiment intérieur : c\'est une décision du Père envers vous avant toute performance. Romains 5:8 affirme que Christ est mort pour nous « alors que nous étions encore pécheurs » — la grâce précède donc la réforme morale.',
        'Distinction cruciale : la grâce qui pardonne (justification) et la grâce qui transforme (sanctification). La première vous place en Christ sans condamnation (Romains 8:1) ; la seconde vous enseigne à renoncer à l\'impiété (Tite 2:11-12). Confondre les deux produit soit du laxisme (« Dieu me pardonnera »), soit du légalisme (« je dois mériter le pardon »).',
        'EIDO insiste : la grâce ne couvre pas seulement, elle produit. Philippiens 2:13 montre que Dieu crée en vous le vouloir et le faire. Vous n\'êtes pas seul dans la croissance : la même grâce qui vous a sauvé vous rend capable de marcher. Ce n\'est pas votre zèle qui porte le poids ; c\'est la dépendance à l\'Esprit.',
        'La grâce brise le joug religieux. Ésaïe 10:27 — « le joug sera détruit à cause de l\'onction » — montre que la performance charnelle ne libère pas ; l\'onction du Saint-Esprit le fait. Beaucoup de croyants prient, jeûnent et servent pour obtenir l\'approbation de Dieu alors qu\'ils sont déjà acceptés en Christ (Éphésiens 1:6).',
        'Application : identifiez une zone où vous « gagnez » l\'amour de Dieu (service, discipline, absence de faute visible). Reposez-vous une semaine entière sur Éphésiens 2:8-10 comme unique fondement : sauvés par grâce, créés pour de bonnes œuvres que Dieu a préparées — non inventées par anxiété.',
        'Méditation : 2 Corinthiens 12:9 — « ma grâce te suffit ». La faiblesse n\'est pas l\'ennemi de la grâce ; elle en est parfois le terrain. La maturité consiste à demander moins de force à soi-même et plus de révélation de ce que Christ a déjà accompli.',
      ],
      en: [
        'Grace is not soft indulgence or permission to stay weak. In EIDO, grace appears from the first pillar — renouncing dead works — because it reveals what God does where humans can no longer produce life on their own (Ephesians 2:8-9; Titus 2:11-12).',
        'Charis (χάρις) means unmerited favor, royal gift, divine initiative — not primarily a feeling but the Father\'s decision toward you before performance. Romans 5:8: Christ died for us « while we were still sinners » — grace precedes moral reform.',
        'Crucial distinction: grace that forgives (justification) and grace that transforms (sanctification). The first places you in Christ without condemnation (Romans 8:1); the second teaches renouncing ungodliness (Titus 2:11-12).',
        'EIDO stresses: grace does not only cover — it produces. Philippians 2:13 shows God working in you both to will and to act. The same grace that saved you enables your walk.',
        'Grace breaks the religious yoke. Isaiah 10:27 — the yoke destroyed « because of the anointing » — shows fleshly striving does not liberate; the Spirit\'s anointing does.',
        'Application: name one area where you « earn » God\'s love. Rest on Ephesians 2:8-10 as foundation: saved by grace, created for good works God prepared.',
        'Meditation: 2 Corinthians 12:9 — « my grace is sufficient. » Weakness is not grace\'s enemy; it is sometimes its soil.',
      ],
    },
    quiz: {
      fr: [
        q('Selon Tite 2:11-12, que fait la grâce en plus de sauver ?', [
          { label: 'a)', text: 'Elle suspend le jugement sans exiger de changement' },
          { label: 'b)', text: 'Elle enseigne à renoncer à l\'impiété et aux convoitises mondaines' },
          { label: 'c)', text: 'Elle remplace la foi par les œuvres' },
          { label: 'd)', text: 'Elle garantit la prospérité matérielle' },
        ], 'b'),
        q('Quelle erreur EIDO associe-t-il à une « œuvre morte » religieuse ?', [
          { label: 'a)', text: 'Servir sans être connecté à la vie de Dieu' },
          { label: 'b)', text: 'Lire la Bible en public' },
          { label: 'c)', text: 'Participer à une cellule de prière' },
          { label: 'd)', text: 'Jeûner occasionnellement' },
        ], 'a'),
        q('Romains 5:8 place la grâce…', [
          { label: 'a)', text: 'Après une vie moralisée' },
          { label: 'b)', text: 'Alors que nous étions encore pécheurs' },
          { label: 'c)', text: 'Uniquement pour les apôtres' },
          { label: 'd)', text: 'Après le baptême d\'eau' },
        ], 'b'),
        q('Ésaïe 10:27 — le joug est détruit…', [
          { label: 'a)', text: 'Par l\'intensité du jeûne' },
          { label: 'b)', text: 'Par la connaissance des doctrines' },
          { label: 'c)', text: 'À cause de l\'onction' },
          { label: 'd)', text: 'Par l\'obéissance à la loi de Moïse' },
        ], 'c'),
        q('Quelle paire distingue correctement justification et sanctification ?', [
          { label: 'a)', text: 'Justification = position en Christ ; sanctification = transformation par la grâce' },
          { label: 'b)', text: 'Justification = Ancien Testament ; sanctification = Nouveau Testament uniquement' },
          { label: 'c)', text: 'Les deux termes sont synonymes en grec' },
          { label: 'd)', text: 'Justification concerne l\'Église ; sanctification les nations' },
        ], 'a'),
        q('Philippiens 2:13 enseigne que…', [
          { label: 'a)', text: 'L\'homme doit produire seul le vouloir et le faire' },
          { label: 'b)', text: 'Dieu produit en nous le vouloir et le faire selon son bon plaisir' },
          { label: 'c)', text: 'Les bonnes œuvres annulent la grâce' },
          { label: 'd)', text: 'La grâce supprime toute responsabilité humaine' },
        ], 'b'),
      ],
      en: [
        q('According to Titus 2:11-12, what does grace do besides save?', [
          { label: 'a)', text: 'Suspends judgment without requiring change' },
          { label: 'b)', text: 'Teaches renouncing ungodliness and worldly passions' },
          { label: 'c)', text: 'Replaces faith with works' },
          { label: 'd)', text: 'Guarantees material prosperity' },
        ], 'b'),
        q('Which error does EIDO link to a religious « dead work »?', [
          { label: 'a)', text: 'Serving without being connected to God\'s life' },
          { label: 'b)', text: 'Reading Scripture in public' },
          { label: 'c)', text: 'Joining a prayer cell' },
          { label: 'd)', text: 'Occasional fasting' },
        ], 'a'),
        q('Romans 5:8 places grace…', [
          { label: 'a)', text: 'After a moralized life' },
          { label: 'b)', text: 'While we were still sinners' },
          { label: 'c)', text: 'Only for apostles' },
          { label: 'd)', text: 'After water baptism' },
        ], 'b'),
        q('Isaiah 10:27 — the yoke is destroyed…', [
          { label: 'a)', text: 'By fasting intensity' },
          { label: 'b)', text: 'By doctrinal knowledge' },
          { label: 'c)', text: 'Because of the anointing' },
          { label: 'd)', text: 'By obeying Moses\' law' },
        ], 'c'),
        q('Which pair correctly distinguishes justification and sanctification?', [
          { label: 'a)', text: 'Justification = position in Christ; sanctification = transformation by grace' },
          { label: 'b)', text: 'Justification = Old Testament only; sanctification = New Testament only' },
          { label: 'c)', text: 'Both terms are Greek synonyms' },
          { label: 'd)', text: 'Justification is for church; sanctification for nations' },
        ], 'a'),
        q('Philippians 2:13 teaches that…', [
          { label: 'a)', text: 'Humans must produce will and action alone' },
          { label: 'b)', text: 'God works in us to will and to act for his good pleasure' },
          { label: 'c)', text: 'Good works cancel grace' },
          { label: 'd)', text: 'Grace removes all human responsibility' },
        ], 'b'),
      ],
    },
  },
  2: {
    titleKey: 'module_e2_title',
    sections: {
      fr: [
        'L\'amour de Dieu n\'est pas une émotion vague : c\'est l\'initiative éternelle du Père révélée en Christ. Jean 3:16 montre que Dieu « a tant aimé le monde » — agapè (ἀγάπη), amour covenantal, fidèle, orienté vers le salut de l\'autre même au prix du sacrifice.',
        'Galates 2:20 — « celui qui m\'a aimé et qui s\'est livré lui-même pour moi » — ancre l\'amour divin dans un acte historique : la croix. L\'amour de Dieu n\'est pas abstrait ; il a un nom, un corps, un sang versé. Toute spiritualité qui parle d\'amour sans croix dérive vers le sentimentalisme.',
        '1 Jean 4:8-10 établit une identité : « Dieu est amour. » Mais Jean ajoute immédiatement la preuve : « voici l\'amour… en ce qu\'il a envoyé son Fils propitiation pour nos péchés. » L\'amour se mesure à ce qu\'il coûte à Dieu, non à ce qu\'il nous fait ressentir le dimanche.',
        'Distinction pastorale : amour complaisant vs amour saint. Dieu aime le pécheur sans approuver le péché (Romains 5:8 + Jean 8:11). Son amour corrige, restaure, discipline (Hébreux 12:6). Un amour qui ne transforme pas n\'est pas l\'amour révélé en EIDO.',
        'Réponse appropriée : non pas seulement gratitude émotionnelle, mais obéissance confiante. Jean 14:15 — « si vous m\'aimez, gardez mes commandements » — n\'annule pas la grâce ; il montre que l\'amour reçu produit une vie alignée. La foi du Fils (EIDO, ch. 2) repose sur celui qui nous a aimés en premier (1 Jean 4:19).',
        'L\'amour envers le prochain est le miroir de l\'amour reçu (1 Jean 4:20-21). Impossible de prétendre aimer Dieu invisible tout en méprisant un frère visible. La communion fraternelle (module 10) est donc la suite logique de ce module.',
        'Exercice : lisez Romains 8:35-39 et listez ce qui, selon Paul, ne peut « nous séparer de l\'amour de Dieu ». Confrontez cette liste à vos peurs actuelles (échec, rejet, passé).',
      ],
      en: [
        'God\'s love is not vague emotion but the Father\'s eternal initiative revealed in Christ. John 3:16: God « so loved the world » — agapè, covenant love oriented toward the other\'s salvation at the cost of sacrifice.',
        'Galatians 2:20 anchors divine love in history: the cross. Love has a name, a body, shed blood. Spirituality without the cross drifts into sentimentalism.',
        '1 John 4:8-10: « God is love » — proved by sending his Son as propitiation for sins. Love is measured by what it cost God.',
        'Pastoral distinction: indulgent vs holy love. God loves sinners without approving sin. Love that never transforms is not EIDO\'s love.',
        'Proper response: not only emotion but trusting obedience (John 14:15). Faith of the Son rests on him who loved us first (1 John 4:19).',
        'Love for neighbor mirrors received love (1 John 4:20-21).',
        'Exercise: read Romans 8:35-39; list what cannot separate us from God\'s love; confront your fears.',
      ],
    },
    quiz: {
      fr: [
        q('1 Jean 4:10 définit l\'amour de Dieu principalement par…', [
          { label: 'a)', text: 'Le sentiment de paix en prière' },
          { label: 'b)', text: 'L\'envoi du Fils comme propitiation pour nos péchés' },
          { label: 'c)', text: 'La prospérité accordée à Israël' },
          { label: 'd)', text: 'L\'absence de discipline' },
        ], 'b'),
        q('Galates 2:20 lie l\'amour de Christ à…', [
          { label: 'a)', text: 'Sa résurrection seule, sans la croix' },
          { label: 'b)', text: 'Son auto-donation (« s\'est livré lui-même pour moi »)' },
          { label: 'c)', text: 'L\'observance du sabbat' },
          { label: 'd)', text: 'La circoncision' },
        ], 'b'),
        q('Quelle affirmation est la plus fidèle à 1 Jean 4:8-10 ?', [
          { label: 'a)', text: 'Dieu est amour donc le péché n\'a plus d\'importance' },
          { label: 'b)', text: 'Dieu est amour et prouve cet amour par la croix' },
          { label: 'c)', text: 'L\'amour de Dieu est identique à l\'amour humain romantique' },
          { label: 'd)', text: 'Seuls les mystiques expérimentent l\'amour de Dieu' },
        ], 'b'),
        q('Jean 14:15 enseigne que l\'amour authentique pour Christ…', [
          { label: 'a)', text: 'Remplace les commandements' },
          { label: 'b)', text: 'Se manifeste par la garde de ses commandements' },
          { label: 'c)', text: 'Exige la perfection légale' },
          { label: 'd)', text: 'Est réservé aux apôtres' },
        ], 'b'),
        q('1 Jean 4:20 affirme qu\'on ne peut pas…', [
          { label: 'a)', text: 'Aimer Dieu sans aimer son frère visible' },
          { label: 'b)', text: 'Aimer son frère sans lire la Bible' },
          { label: 'c)', text: 'Prier sans jeûner' },
          { label: 'd)', text: 'Servir sans dons spirituels' },
        ], 'a'),
      ],
      en: [
        q('1 John 4:10 defines God\'s love chiefly by…', [
          { label: 'a)', text: 'Peace felt in prayer' },
          { label: 'b)', text: 'Sending the Son as propitiation for sins' },
          { label: 'c)', text: 'Prosperity given to Israel' },
          { label: 'd)', text: 'Absence of discipline' },
        ], 'b'),
        q('Galatians 2:20 links Christ\'s love to…', [
          { label: 'a)', text: 'Resurrection alone without the cross' },
          { label: 'b)', text: 'Self-giving (« gave himself for me »)' },
          { label: 'c)', text: 'Sabbath observance' },
          { label: 'd)', text: 'Circumcision' },
        ], 'b'),
        q('Which statement best fits 1 John 4:8-10?', [
          { label: 'a)', text: 'God is love so sin no longer matters' },
          { label: 'b)', text: 'God is love and proves it through the cross' },
          { label: 'c)', text: 'God\'s love equals romantic human love' },
          { label: 'd)', text: 'Only mystics experience God\'s love' },
        ], 'b'),
        q('John 14:15 teaches authentic love for Christ…', [
          { label: 'a)', text: 'Replaces commandments' },
          { label: 'b)', text: 'Shows in keeping his commandments' },
          { label: 'c)', text: 'Requires legal perfection' },
          { label: 'd)', text: 'Is for apostles only' },
        ], 'b'),
        q('1 John 4:20 says we cannot…', [
          { label: 'a)', text: 'Love God while hating a visible brother' },
          { label: 'b)', text: 'Love brother without reading Bible' },
          { label: 'c)', text: 'Pray without fasting' },
          { label: 'd)', text: 'Serve without spiritual gifts' },
        ], 'a'),
      ],
    },
  },
};

import { EIDO_PART2 } from './courseContentEidoPart2.js';
import { EIDO_DEEP_1_7 } from './courseContentEidoDeep1.js';
import { EIDO_DEEP_8_13 } from './courseContentEidoDeep2.js';

const EIDO_DEEP = { ...EIDO_DEEP_1_7, ...EIDO_DEEP_8_13 };

function mergeSections(base, deep) {
  if (!deep) return base;
  return {
    fr: [...(base?.fr || []), ...(deep.fr || [])],
    en: [...(base?.en || []), ...(deep.en || [])],
  };
}

/** Contenu complet parcours EIDO (13 modules). */
export function buildEidoCourseContent() {
  const merged = { ...EIDO_COURSE_CONTENT, ...EIDO_PART2 };
  return Object.fromEntries(
    Object.entries(merged).map(([idx, mod]) => {
      const num = Number(idx);
      const sections = mergeSections(mod.sections, EIDO_DEEP[num]);
      return [
        num,
        { titleKey: mod.titleKey, sections, quiz: mod.quiz },
      ];
    })
  );
}
