import { AdminVocabulario } from "@/componentes/admin-vocabulario";
import { aferirDto, procedenciasDoModelo, vocabularioDoAdmin } from "@/dados/admin";

/**
 * `/admin/vocabulario` — A4, a saúde do tesauro sem escrevê-lo.
 *
 * Página e componente de servidor: esta tela não escreve. Aprovar promoção é ato sobre uma
 * proposta do Editor, e a proposta não existe no protótipo — a tela declara a separação em
 * vez de simular um fluxo que não tem a outra ponta.
 */
export const metadata = {
  title: "Vocabulário e procedência · Admin",
  description:
    "O tamanho do tesauro, as linguagens promovidas da Enciclopédia e as procedências do " +
    "acervo — monitorados por quem aprova a promoção, não por quem a escreve.",
};

export default function PaginaDeVocabulario() {
  return (
    <AdminVocabulario
      dados={aferirDto("admin/vocabulario", {
        ...vocabularioDoAdmin(),
        procedencias: procedenciasDoModelo(),
      })}
    />
  );
}
