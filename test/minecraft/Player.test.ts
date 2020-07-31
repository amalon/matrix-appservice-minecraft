import { Player, PlayerManager } from '../../src/minecraft';


const pm = new PlayerManager();
let player: Player;
beforeAll(async () => {
  player = await pm.getPlayer('dhmci');
})

// Expectations
const expectedUUID = '5bce3068e4f3489fb66b5723b2a7cdb1';
const expectedNameHistory = [
  { name: "XZFireShadowZX" }, {
    name: "DevrTech",
    changedToAt: 1456277207000
  }, { name: "DevrCraft", changedToAt: 1471555331000 }, {
    name: "DevrTroll",
    changedToAt: 1486180334000
  }, { name: "drhacko", changedToAt: 1514769604000 }, {
    name: "devr2k",
    changedToAt: 1548879760000
  }, { name: "dylhack", changedToAt: 1559091024000 }, {
    name: "dhmci",
    changedToAt: 1588978578000
  }]
const expectedProfile = {
  id: "5bce3068e4f3489fb66b5723b2a7cdb1",
  name: "dhmci",
  properties: [
    {
      name: "textures",
      value: "ewogICJ0aW1lc3RhbXAiIDogMTU4OTkwMTQwNzU5MCwKICAicHJvZmlsZUlkIiA6ICI1YmNlMzA2OGU0ZjM0ODlmYjY2YjU3MjNiMmE3Y2RiMSIsCiAgInByb2ZpbGVOYW1lIiA6ICJkaG1jaSIsCiAgInRleHR1cmVzIiA6IHsKICAgICJTS0lOIiA6IHsKICAgICAgInVybCIgOiAiaHR0cDovL3RleHR1cmVzLm1pbmVjcmFmdC5uZXQvdGV4dHVyZS8xNjcxY2E1N2I3OWYxZTBjN2Y2NjE5NDE1NDYyNDlhYmE0ZWZiYTU4NDg3MDQ1M2MxZmIxYThhNzRjYjIwYmJiIiwKICAgICAgIm1ldGFkYXRhIiA6IHsKICAgICAgICAibW9kZWwiIDogInNsaW0iCiAgICAgIH0KICAgIH0KICB9Cn0="
    }]
}

// Tests

it('<Player>.getUUID should return player\'s UUID', async function () {
  const uuid = await player.getUUID();

  expect(uuid).toBe(expectedUUID);
});

it('<Player>.getNameHistory should return player\'s name history', async function () {
  const names = await player.getNameHistory();
  expect(names).toStrictEqual(expectedNameHistory);
});

it('<Player>.getProfile should return player\'s profile', async function () {
  const profile = await player.getProfile();

  expect(profile).toStrictEqual(expectedProfile);
})

it('<Player>.getSkin should return player\'s skin as a buffer', async function () {
  const skin = await player.getSkin();

  expect(skin).toBeDefined();
});
