import { EsqueletoBloco, EsqueletoLista, TelaEsqueleto } from "@/componentes/esqueleto";

export default function StudioPublicar() {
  return (
    <TelaEsqueleto
      nome="Studio — publicar evento"
      camada="C3"
      objetivo="O cadastro com validação e devolutiva de qualidade: score subindo conforme se preenche, aviso de possível duplicata antes de salvar e descrição alternativa de imagem obrigatória."
    >
      <EsqueletoBloco altura="4rem" rotulo="cabeçalho da superfície · escopo e contexto de quem opera" />
      <EsqueletoLista
        rotulos={[
          "formulário guiado · evento, temporada, ocorrências",
          "validação em tempo real",
          "score de qualidade, apontando o que falta",
          "aviso de possível duplicata ANTES de salvar",
          "descrição alternativa de imagem, obrigatória",
        ]}
      />
    </TelaEsqueleto>
  );
}
