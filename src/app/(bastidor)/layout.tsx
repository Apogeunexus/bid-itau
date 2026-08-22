import { AvisoDesktop } from "@/componentes/aviso-desktop";

/**
 * Layout das três superfícies de bastidor — Studio, Redação e Observatório.
 *
 * Estas seis rotas NÃO recebem a barra de abas: elas não são o app. E existem só na web,
 * a única exceção que D-05 autoriza. A divergência é feita por `app:`/`desk:` em vez de
 * por ramo em JavaScript, então o conteúdo já sai no artefato estático e não depende de
 * hidratação para aparecer — o gatilho continua sendo `data-view` (D-02).
 */
export default function LayoutBastidor({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <AvisoDesktop />
      <div className="app:hidden">{children}</div>
    </div>
  );
}
