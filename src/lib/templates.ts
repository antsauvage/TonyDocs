export interface Template {
  id: string
  name: string
  /** Title given to documents created from this template. */
  title: string
  html: string
}

const today = () => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date())

export const TEMPLATES: Template[] = [
  {
    id: 'blank',
    name: 'Document vierge',
    title: '',
    html: '<p></p>',
  },
  {
    id: 'meeting',
    name: 'Compte rendu',
    title: 'Compte rendu de réunion',
    get html() {
      return `
<h1>Compte rendu de réunion</h1>
<p><span style="color: #666666">${today()} · Salle Horizon · 10h00 – 11h00</span></p>
<h2>Participants</h2>
<p>Camille Martin, Hugo Bernard, Léa Dubois, Nicolas Petit</p>
<h2>Ordre du jour</h2>
<ol><li><p>Bilan du trimestre</p></li><li><p>Lancement de la nouvelle offre</p></li><li><p>Questions diverses</p></li></ol>
<h2>Décisions</h2>
<ul><li><p>Le lancement est confirmé pour le <strong>15 novembre</strong>.</p></li><li><p>Le budget marketing est augmenté de 10 %.</p></li></ul>
<h2>Actions</h2>
<ul data-type="taskList">
<li data-type="taskItem" data-checked="true"><p>Valider la maquette du site — <em>Léa</em></p></li>
<li data-type="taskItem" data-checked="false"><p>Préparer le communiqué de presse — <em>Hugo</em></p></li>
<li data-type="taskItem" data-checked="false"><p>Planifier la formation commerciale — <em>Camille</em></p></li>
</ul>`
    },
  },
  {
    id: 'letter',
    name: 'Lettre',
    title: 'Lettre',
    get html() {
      return `
<p><strong>Camille Martin</strong><br>12 rue des Lilas<br>75011 Paris<br>camille.martin@exemple.fr</p>
<p style="text-align: right">Paris, le ${today()}</p>
<p>À l'attention de Madame Dupont<br>Société Exemple<br>8 avenue de la République<br>69002 Lyon</p>
<p><strong>Objet : candidature au poste de cheffe de projet</strong></p>
<p>Madame,</p>
<p style="text-align: justify">Je me permets de vous adresser ma candidature pour le poste de cheffe de projet publié sur votre site. Forte de sept années d'expérience dans la conduite de projets numériques, je souhaite aujourd'hui mettre mes compétences au service d'une équipe ambitieuse comme la vôtre.</p>
<p style="text-align: justify">Je serais ravie de vous présenter plus en détail mon parcours lors d'un entretien.</p>
<p>Je vous prie d'agréer, Madame, l'expression de mes salutations distinguées.</p>
<p style="text-align: right">Camille Martin</p>`
    },
  },
  {
    id: 'report',
    name: 'Rapport de projet',
    title: 'Rapport de projet',
    get html() {
      return `
<h1 style="text-align: center"><span style="font-family: 'Playfair Display Variable'">Projet Atlas</span></h1>
<p style="text-align: center"><span style="color: #666666">Rapport d'avancement · ${today()}</span></p>
<h2>Synthèse</h2>
<p style="text-align: justify">Le projet Atlas vise à moderniser la plateforme client d'ici la fin de l'année. Les jalons du premier semestre sont atteints et le budget est maîtrisé.</p>
<blockquote><p>« Une base technique solide, une équipe engagée : nous sommes en avance sur le planning. »</p></blockquote>
<h2>Indicateurs clés</h2>
<table><tbody>
<tr><th><p>Indicateur</p></th><th><p>Objectif</p></th><th><p>Réalisé</p></th></tr>
<tr><td><p>Avancement</p></td><td><p>60 %</p></td><td><p>68 %</p></td></tr>
<tr><td><p>Budget consommé</p></td><td><p>55 %</p></td><td><p>51 %</p></td></tr>
<tr><td><p>Satisfaction client</p></td><td><p>4,2 / 5</p></td><td><p>4,6 / 5</p></td></tr>
</tbody></table>
<h2>Prochaines étapes</h2>
<ol><li><p>Recette utilisateur en novembre</p></li><li><p>Migration des données en décembre</p></li><li><p>Mise en production en janvier</p></li></ol>`
    },
  },
  {
    id: 'resume',
    name: 'CV',
    title: 'Curriculum vitæ',
    html: `
<h1><span style="font-size: 26pt">Camille Martin</span></h1>
<p><span style="color: #0b57d0"><strong>Cheffe de projet digital</strong></span><br><span style="color: #666666">Paris · camille.martin@exemple.fr · 06 12 34 56 78</span></p>
<hr>
<h2>Expérience</h2>
<h3>Responsable de projets — Agence Nova</h3>
<p><span style="color: #666666"><em>2021 – aujourd'hui</em></span></p>
<ul><li><p>Pilotage de 15 projets web pour des clients grands comptes</p></li><li><p>Management d'une équipe de 6 personnes</p></li></ul>
<h3>Consultante — Studio Lumen</h3>
<p><span style="color: #666666"><em>2017 – 2021</em></span></p>
<ul><li><p>Conception de parcours utilisateurs et ateliers clients</p></li></ul>
<h2>Formation</h2>
<p><strong>Master Management de l'innovation</strong> — Université Paris-Dauphine, 2017</p>
<h2>Compétences</h2>
<p>Gestion de projet agile · UX design · Animation d'ateliers · Anglais courant</p>`,
  },
]

export const WELCOME_TITLE = 'Bienvenue dans TonyDocs'

export const WELCOME_HTML = `
<h1>Bienvenue dans TonyDocs 👋</h1>
<p>TonyDocs est un traitement de texte <strong>rapide</strong>, <em>élégant</em> et entièrement <mark data-color="#c9daf8" style="background-color: #c9daf8">dans votre navigateur</mark>. Vos documents sont enregistrés automatiquement sur cet appareil.</p>
<h2>Mise en forme</h2>
<p>Utilisez la barre d'outils pour le <strong>gras</strong>, l'<em>italique</em>, le <u>souligné</u>, le <s>barré</s>, les <span style="color: #cc0000">couleurs</span>, le <mark data-color="#fff2cc" style="background-color: #fff2cc">surlignage</mark>, les exposants (E = mc<sup>2</sup>) et les indices (H<sub>2</sub>O). Sélectionnez du texte pour faire apparaître le menu contextuel.</p>
<h2>Raccourcis Markdown</h2>
<ul>
<li><p>Tapez <code>#</code> puis espace pour un titre, <code>-</code> pour une liste, <code>1.</code> pour une liste numérotée</p></li>
<li><p>Tapez <code>&gt;</code> pour une citation et <code>[ ]</code> pour une case à cocher</p></li>
<li><p>Tapez <code>/</code> pour ouvrir le menu d'insertion</p></li>
</ul>
<h2>À essayer</h2>
<ul data-type="taskList">
<li data-type="taskItem" data-checked="true"><p>Ouvrir ce document de bienvenue</p></li>
<li data-type="taskItem" data-checked="false"><p>Rechercher et remplacer un mot avec <code>Ctrl+H</code></p></li>
<li data-type="taskItem" data-checked="false"><p>Afficher le plan du document dans le panneau de gauche</p></li>
<li data-type="taskItem" data-checked="false"><p>Exporter en PDF, Word ou Markdown depuis le menu Fichier</p></li>
<li data-type="taskItem" data-checked="false"><p>Passer en mode sombre depuis le menu Affichage</p></li>
</ul>
<blockquote><p>« La simplicité est la sophistication suprême. » — Léonard de Vinci</p></blockquote>
<h2>Tableaux</h2>
<table><tbody>
<tr><th><p>Fonctionnalité</p></th><th><p>Raccourci</p></th></tr>
<tr><td><p>Annuler / rétablir</p></td><td><p>Ctrl+Z / Ctrl+Y</p></td></tr>
<tr><td><p>Rechercher</p></td><td><p>Ctrl+F</p></td></tr>
<tr><td><p>Tous les raccourcis</p></td><td><p>Ctrl+/</p></td></tr>
</tbody></table>
<p>Bonne écriture ! ✍️</p>`
