import { verse } from '../utils.js';

const fr = [
  verse(1, 'Au commencement était la Parole, et la Parole était avec Dieu, et la Parole était Dieu.', [
    ['commencement', 'G746'],
    ['Parole', 'G3056'],
    ['Dieu', 'G2316'],
  ]),
  verse(2, 'Elle était au commencement avec Dieu.', [
    ['commencement', 'G746'],
    ['Dieu', 'G2316'],
  ]),
  verse(3, 'Toutes choses ont été faites par elle, et rien de ce qui a été fait n\'a été fait sans elle.', [
    ['faites', 'G1096'],
    ['Parole', 'G3056'],
  ]),
  verse(4, 'En elle était la vie, et la vie était la lumière des hommes.', [
    ['vie', 'G2222'],
    ['lumière', 'G5457'],
    ['hommes', 'G444'],
  ]),
  verse(5, 'La lumière luit dans les ténèbres, et les ténèbres ne l\'ont point reçue.', [
    ['lumière', 'G5457'],
    ['ténèbres', 'G4655'],
  ]),
  verse(6, 'Il parut un homme, envoyé de Dieu, qui s\'appelait Jean.', [
    ['homme', 'G444'],
    ['Dieu', 'G2316'],
  ]),
  verse(7, 'Il vint pour servir de témoin, afin de rendre témoignage à la lumière, pour que tous crussent par lui.', [
    ['témoin', 'G3144'],
    ['lumière', 'G5457'],
    ['crussent', 'G4100'],
  ]),
  verse(8, 'Il n\'était pas la lumière, mais il parut pour rendre témoignage à la lumière.', [
    ['lumière', 'G5457'],
  ]),
  verse(9, 'Cette lumière était la véritable lumière, qui, en venant dans le monde, éclaire tout homme.', [
    ['lumière', 'G5457'],
    ['véritable', 'G228'],
    ['monde', 'G2889'],
    ['homme', 'G444'],
  ]),
  verse(10, 'Elle était dans le monde, et le monde a été fait par elle, et le monde ne l\'a point connue.', [
    ['monde', 'G2889'],
    ['fait', 'G1096'],
  ]),
  verse(11, 'Elle est venue chez les siens, et les siens ne l\'ont point reçue.', [['siens', 'G2398']]),
  verse(12, 'Mais à tous ceux qui l\'ont reçue, à ceux qui croient en son nom, elle a donné le pouvoir de devenir enfants de Dieu,', [
    ['reçue', 'G2983'],
    ['croient', 'G4100'],
    ['Dieu', 'G2316'],
  ]),
  verse(13, 'lesquels sont nés, non du sang, ni de la volonté de la chair, ni de la volonté de l\'homme, mais de Dieu.', [
    ['nés', 'G1080'],
    ['homme', 'G444'],
    ['Dieu', 'G2316'],
  ]),
  verse(14, 'Et la Parole a été faite chair, et elle a habité parmi nous, pleine de grâce et de vérité ; et nous avons contemplé sa gloire, une gloire comme la gloire du Fils unique venu du Père.', [
    ['Parole', 'G3056'],
    ['chair', 'G4561'],
    ['grâce', 'G5485'],
    ['vérité', 'G225'],
    ['Fils', 'G3439'],
  ]),
  verse(15, 'Jean lui a rendu témoignage, et s\'est écrié, en disant : C\'est celui dont j\'ai dit : Celui qui vient après moi a passé avant moi, car il était avant moi.', [
    ['témoignage', 'G3140'],
    ['Jean', 'G2491'],
  ]),
  verse(16, 'Et nous avons tous reçu de sa plénitude, et grâce pour grâce.', [
    ['reçu', 'G2983'],
    ['grâce', 'G5485'],
  ]),
  verse(17, 'Car la loi a été donnée par Moïse ; la grâce et la vérité sont venues par Jésus-Christ.', [
    ['loi', 'G3551'],
    ['grâce', 'G5485'],
    ['vérité', 'G225'],
    ['Christ', 'G5547'],
  ]),
  verse(18, 'Personne n\'a jamais vu Dieu ; le Fils unique, qui est dans le sein du Père, est celui qui l\'a fait connaître.', [
    ['Dieu', 'G2316'],
    ['Fils', 'G3439'],
    ['Père', 'G3962'],
  ]),
];

const en = [
  verse(1, 'In the beginning was the Word, and the Word was with God, and the Word was God.', [
    ['beginning', 'G746'],
    ['Word', 'G3056'],
    ['God', 'G2316'],
  ]),
  verse(2, 'He was in the beginning with God.', [
    ['beginning', 'G746'],
    ['God', 'G2316'],
  ]),
  verse(3, 'All things were made through him, and without him was not any thing made that was made.', [
    ['made', 'G1096'],
    ['Word', 'G3056'],
  ]),
  verse(4, 'In him was life, and the life was the light of men.', [
    ['life', 'G2222'],
    ['light', 'G5457'],
  ]),
  verse(5, 'The light shines in the darkness, and the darkness has not overcome it.', [
    ['light', 'G5457'],
    ['darkness', 'G4655'],
  ]),
  verse(6, 'There was a man sent from God, whose name was John.', [
    ['man', 'G444'],
    ['God', 'G2316'],
  ]),
  verse(7, 'He came as a witness, to bear witness about the light, that all might believe through him.', [
    ['witness', 'G3144'],
    ['light', 'G5457'],
    ['believe', 'G4100'],
  ]),
  verse(8, 'He was not the light, but came to bear witness about the light.', [['light', 'G5457']]),
  verse(9, 'The true light, which gives light to everyone, was coming into the world.', [
    ['light', 'G5457'],
    ['world', 'G2889'],
  ]),
  verse(10, 'He was in the world, and the world was made through him, yet the world did not know him.', [
    ['world', 'G2889'],
    ['made', 'G1096'],
  ]),
  verse(11, 'He came to his own, and his own people did not receive him.', [['own', 'G2398']]),
  verse(12, 'But to all who did receive him, who believed in his name, he gave the right to become children of God,', [
    ['believed', 'G4100'],
    ['God', 'G2316'],
  ]),
  verse(13, 'who were born, not of blood nor of the will of the flesh nor of the will of man, but of God.', [
    ['born', 'G1080'],
    ['man', 'G444'],
    ['God', 'G2316'],
  ]),
  verse(14, 'And the Word became flesh and dwelt among us, and we have seen his glory, glory as of the only Son from the Father, full of grace and truth.', [
    ['Word', 'G3056'],
    ['flesh', 'G4561'],
    ['grace', 'G5485'],
    ['truth', 'G225'],
    ['Son', 'G3439'],
  ]),
  verse(15, '(John bore witness to him, and cried out, “This was he of whom I said, ‘He who comes after me ranks before me, because he was before me.’”)', [
    ['witness', 'G3140'],
    ['John', 'G2491'],
  ]),
  verse(16, 'For from his fullness we have all received, grace upon grace.', [
    ['received', 'G2983'],
    ['grace', 'G5485'],
  ]),
  verse(17, 'For the law was given through Moses; grace and truth came through Jesus Christ.', [
    ['law', 'G3551'],
    ['grace', 'G5485'],
    ['truth', 'G225'],
    ['Christ', 'G5547'],
  ]),
  verse(18, 'No one has ever seen God; the only God, who is at the Father’s side, he has made him known.', [
    ['God', 'G2316'],
    ['Son', 'G3439'],
    ['Father', 'G3962'],
  ]),
];

export default { fr: { verses: fr }, en: { verses: en } };
