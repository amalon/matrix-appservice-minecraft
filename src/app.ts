/**
 * This is project Marco, a Matrix appservice bridge (relay) to connect
 * Minecraft servers and Matrix rooms together.
 * @author Dylan Hackworth <dhpf@pm.me>
 * @LICENSE GNU GPLv3
 */
import { Marco } from "./Marco";


function main() {
  const marco = new Marco();

  marco.start().catch(console.error);
}

main();
