import { useEffect, useState } from "react";
import hero1 from "@/assets/hero-simach-1.jpg";
import hero2 from "@/assets/hero-simach-2.jpg";
import hero3 from "@/assets/hero-simach-3.jpg";
import logoSimach from "@/assets/logo-simach.png";
import ApplicationForm from "@/components/ApplicationForm";
import ActiveOpenings from "@/components/ActiveOpenings";
import { Forklift, Shovel, Wrench, Truck } from "lucide-react";

const heroImages = [hero1, hero2, hero3];

const features = [
  {
    icon: Forklift,
    title: "Autoelevadores Hangcha",
    desc: "Venta de autoelevadores para industria, logística y operaciones de depósito.",
  },
  {
    icon: Shovel,
    title: "Excavadoras Sunward",
    desc: "Maquinaria pesada para construcción, movimiento de suelo e industria.",
  },
  {
    icon: Wrench,
    title: "Servicios industriales",
    desc: "Montaje, mantenimiento y soluciones técnicas para operaciones industriales.",
  },
  {
    icon: Truck,
    title: "Rental",
    desc: "Alquiler de equipos viales en San Lorenzo y Gran Rosario.",
  },
];

export default function Index() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      <nav className="bg-card border-b border-border h-20 shrink-0 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-full px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logoSimach}
              alt="Logo SIMACH"
              width={180}
              height={54}
              className="h-10 md:h-12 w-auto"
            />
          </div>

          <div className="flex items-center gap-4 md:gap-10">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Recursos Humanos
              </span>
              <a
                href="mailto:rrhh@simach.com.ar"
                className="text-base font-semibold text-foreground hover:text-primary transition-colors"
              >
                rrhh@simach.com.ar
              </a>
            </div>

            <div className="hidden md:block h-10 w-px bg-border" />

            <div className="hidden sm:flex flex-col text-xs md:text-sm font-medium text-muted-foreground">
              <a
                href="https://www.simach.com.ar"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary transition-colors"
              >
                simach.com.ar
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <section className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <div className="grid grid-cols-12 gap-0 border border-border bg-card overflow-hidden shadow-lg rounded-xl">
            <div className="col-span-12 lg:col-span-5 relative bg-secondary min-h-[240px] lg:min-h-[360px] overflow-hidden">
              {heroImages.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="SIMACH soluciones industriales y viales"
                  className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-700 ${
                    i === slide ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ filter: "saturate(0.9) contrast(1.05)" }}
                  loading={i === 0 ? "eager" : "lazy"}
                />
              ))}

              <div className="absolute inset-0 bg-secondary/45 pointer-events-none" />
            </div>

            <div className="col-span-12 lg:col-span-7 p-6 md:p-8 lg:p-10 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-border">
              <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight mb-5 leading-[1.05] uppercase">
                Nuestra esencia
              </h1>

              <div className="space-y-5 max-w-[62ch]">
                <div>
                  <h2 className="text-sm md:text-base font-semibold text-foreground mb-1">
                    Marcamos el camino en soluciones industriales y viales
                  </h2>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    En SIMACH S.R.L. brindamos soluciones para operaciones industriales,
                    logísticas y de construcción, integrando venta de maquinaria, servicios
                    técnicos, mantenimiento y alquiler de equipos.
                  </p>
                </div>

                <div>
                  <h2 className="text-sm md:text-base font-semibold text-foreground mb-1">
                    Nuestro compromiso
                  </h2>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    Trabajamos con responsabilidad, seguridad y profesionalismo para acompañar
                    a nuestros clientes con respuestas eficientes, soporte técnico y soluciones
                    pensadas para operaciones que no pueden detenerse.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
          <div className="bg-card border border-border p-6 md:p-8 shadow-sm rounded-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className="shrink-0 size-14 md:size-16 bg-muted flex items-center justify-center rounded-xl">
                  <div className="size-8 rounded-md border-t-4 border-l-4 border-primary" />
                </div>

                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
                    Trabajá con nosotros
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Esta es la página oficial de postulaciones de SIMACH. Dejanos tu perfil
                    y te contactamos cuando surja una oportunidad.
                  </p>
                </div>
              </div>

              <a
                href="#postulacion"
                className="shrink-0 self-start md:self-center inline-flex items-center justify-center bg-primary text-primary-foreground px-8 py-4 rounded-lg font-bold tracking-wide text-sm shadow-md hover:opacity-90 transition-all"
              >
                Enviar Currículum
              </a>
            </div>
          </div>
        </section>

        <section className="py-10 md:py-12 bg-muted">
          <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="flex flex-col items-center text-center gap-2 bg-card rounded-xl border border-border p-5 shadow-sm"
                >
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-2 shadow-md transition-transform hover:scale-110">
                    <Icon className="w-7 h-7 text-primary-foreground" />
                  </div>

                  <h3 className="font-semibold text-foreground text-sm">
                    {feature.title}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <ActiveOpenings />

        <section id="postulacion" className="py-16 bg-background scroll-mt-24">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="flex flex-col items-center text-center mb-10">
              <img
                src={logoSimach}
                alt="Logo SIMACH"
                className="h-16 md:h-20 w-auto mb-6"
              />

              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                Formulario de Postulación
              </h2>

              <p className="text-muted-foreground mt-2">
                Podés postularte a una búsqueda activa o dejarnos tus datos para futuras
                oportunidades. Tu perfil quedará registrado en nuestra base de candidatos.
              </p>
            </div>

            <div className="bg-card rounded-xl shadow-lg border p-6 md:p-10">
              <ApplicationForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-secondary">
        <div className="container mx-auto px-4 text-center space-y-2">
          <p className="text-secondary-foreground/90 text-sm">
            Autoelevadores Hangcha | Excavadoras Sunward | Servicios Industriales | Rental de Equipos
          </p>

          <p className="text-secondary-foreground text-sm font-medium">
            <a
              href="https://www.simach.com.ar"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary transition-colors"
            >
              WWW.SIMACH.COM.AR
            </a>
            {" — CEL: (341) 6751108"}
          </p>

          <p className="text-secondary-foreground/60 text-xs pt-2">
            © {new Date().getFullYear()} SIMACH SRL
          </p>
        </div>
      </footer>
    </div>
  );
}
