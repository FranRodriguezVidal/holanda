// Pool of 100 names used to randomly label the bot opponent in offline matches.
const BOT_NAMES = [
  'Ana', 'Bruno', 'Carmen', 'Diego', 'Elena', 'Fernando', 'Gabriela', 'Hugo',
  'Irene', 'Javier', 'Karla', 'Luis', 'Marta', 'Nicolás', 'Olivia', 'Pablo',
  'Raquel', 'Sergio', 'Teresa', 'Ulises', 'Valeria', 'Wendy', 'Ximena', 'Yago',
  'Zoe', 'Adrián', 'Beatriz', 'Cristian', 'Daniela', 'Emilio', 'Flor', 'Gonzalo',
  'Helena', 'Iker', 'Julia', 'Kevin', 'Laura', 'Mateo', 'Natalia', 'Óscar',
  'Paula', 'Quique', 'Rosa', 'Santiago', 'Tatiana', 'Unai', 'Victoria', 'Walter',
  'Ximo', 'Yolanda', 'Zacarías', 'Alba', 'Bautista', 'Camila', 'David', 'Estela',
  'Federico', 'Gala', 'Héctor', 'Inés', 'Jorge', 'Karina', 'Leandro', 'Mónica',
  'Nadia', 'Omar', 'Patricia', 'Quintín', 'Rubén', 'Sara', 'Tomás', 'Úrsula',
  'Vicente', 'Wilson', 'Xavier', 'Yasmín', 'Zoraida', 'Amanda', 'Bernardo', 'Clara',
  'Darío', 'Estefanía', 'Facundo', 'Gisela', 'Ismael', 'Jimena', 'Kiara', 'Leonardo',
  'Miriam', 'Nicolás', 'Octavio', 'Petra', 'Quiteria', 'Ricardo', 'Silvia', 'Tobías',
  'Uriel', 'Vera', 'Wendolyn', 'Yerai',
];

export function getRandomBotName(): string {
  const randomIndex = Math.floor(Math.random() * BOT_NAMES.length);
  return BOT_NAMES[randomIndex] ?? 'Bot';
}
