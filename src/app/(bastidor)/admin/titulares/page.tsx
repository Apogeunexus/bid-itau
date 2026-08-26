import { AdminTitulares } from "@/componentes/admin-titulares";
import { aferirDto, tiposDeTitular } from "@/dados/admin";

/**
 * `/admin/titulares` — A8, os pedidos de quem é titular do dado.
 *
 * As contagens dos dois tipos de titular saem do acervo: quantas `pessoa-usuaria` existem e
 * quantas `pessoa` o grafo documenta sem cadastro nenhum. É a segunda que faz esta tela ser
 * diferente de um painel de LGPD comum.
 */
export const metadata = {
  title: "Titulares e LGPD · Admin",
  description:
    "Os pedidos de quem se cadastrou e os de quem está no acervo sem nunca ter se " +
    "cadastrado — dois direitos diferentes, com prazos e desfechos registrados.",
};

export default function PaginaDeTitulares() {
  return <AdminTitulares tipos={aferirDto("admin/titulares", tiposDeTitular())} />;
}
