import { Marco } from "./Marco";


function main() {
  const marco = new Marco();

  marco.start().catch(console.error);
}

main();
