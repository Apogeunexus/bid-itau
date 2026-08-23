import type { Metadata } from "next";
import { HubApps } from "@/componentes/hub-apps";

export const metadata: Metadata = { title: "Apps — Agenda Cultural BR" };

/**
 * `/apps` — o destino do quinto botão da barra inferior.
 *
 * É rota de verdade, e não uma folha sobreposta, por dois motivos: ela precisa
 * ter endereço para a demonstração ser aberta direto, e o botão que a abre é
 * uma ABA — voltar dali é voltar para a aba anterior, comportamento que o
 * histórico do navegador já dá de graça e que uma folha teria de imitar.
 */
export default function Apps() {
  return <HubApps />;
}
