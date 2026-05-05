import { useEffect, useState } from "react";
import hero1 from "@/assets/hero-simach-1.jpg";
import hero2 from "@/assets/hero-simah-2.jpg";
import hero3 from "@/assets/hero-simach-3.jpg";
import logoSimach from "@/assets/logo-simach.png";
import ApplicationForm from "@/components/ApplicationForm";
import ActiveOpenings from "@/components/ActiveOpenings";
import { Forklift, Shovel, Wrench, Truck } from "lucide-react";

const heroImages = [hero1, hero2, hero3];

const features = [
  { icon: Forklift, title: "Autoelevadores Hangcha", desc: "Venta de autoelevadores para la industria y la logística" },
  { icon: Shovel, title: "Excavadoras Sunward", desc: "Maquinaria pesada para construcción e industria" },
  { icon: Wrench, title: "Servicios industriales", desc: "Montaje, mantenimiento y proyectos industriales" },
  { icon: Truck, title: "Rental", desc: "Alquiler de equipos viales en San Lorenzo y Gran Rosario" },
];

export default function Index() {
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % heroImages.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Top bar: logo + contacto */}
      <nav className="bg-card border-b-2 border-border h-20 shrink-0 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-full px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoSimach} alt="Logo SIMACH" width={160} height={48} className="h-10 md:h-12 w-auto" />
          </div>

          <div className="flex items-center gap-4 md:gap-10">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Recursos Humanos</span>
              <a href="mailto:rrhh@simach.com.ar" className="text-base font-semibold text-foreground hover:text-primary transition-colors">
                rrhh@simach.com.ar
              </a>
            </div>
            <div className="hidden md:block h-10 w-px bg-border"></div>
            <div className="hidden sm:flex flex-col text-xs md:text-sm font-medium text-muted-foreground">
              <a href="https://www.grumaq.com.ar" className="hover:text-primary transition-colors">grumaq.com.ar</a>
              <a href="https://usados.grumaq.com.ar" className="hover:text-primary transition-colors">usados.grumaq.com.ar</a>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {/* Hero compacto: imagen + sobre nosotros */}
        <section className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <div className="grid grid-cols-12 gap-0 border-2 border-foreground bg-card overflow-hidden shadow-[0_3px_0_0_hsl(var(--foreground))]">
            {/* Imagen carrusel */}
            <div className="col-span-12 lg:col-span-5 relative bg-secondary min-h-[220px] lg:min-h-[340px] overflow-hidden">
              {heroImages.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt="GRUMAQ servicio y equipo"
                  className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-700 ${i === slide ? "opacity-100" : "opacity-0"}`}
                  style={{ filter: "saturate(0.85) contrast(1.05)" }}
                  loading={i === 0 ? "eager" : "lazy"}
                />
              ))}
              <div className="absolute inset-0 bg-primary/10 mix-blend-multiply pointer-events-none"></div>
            </div>

            {/* Sobre nosotros */}
            <div className="col-span-12 lg:col-span-7 p-6 md:p-8 lg:p-10 flex flex-col justify-center border-t-2 lg:border-t-0 lg:border-l-2 border-foreground">
              <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight mb-5 leading-[1.05] uppercase">
                Nuestra esencia
              </h1>

              <div className="space-y-4 max-w-[60ch]">
                <div>
                  <h2 className="text-sm md:text-base font-semibold text-foreground mb-1">Marcamos el Camino en Soluciones Industriales y Viales</h2>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    Desde servicios industriales de alta calidad hasta el alquiler y venta de maquinaria vial, en SIMACH S.R.L. trabajamos con responsabilidad y profesionalismo para garantizar resultados que superan expectativas. centro, especializado en la comercialización, alquiler y soporte integral de maquinaria para construcción, agroindustria, izaje y logística de materiales.
                  </p>
                </div>
                <div>
                  <h2 className="text-sm md:text-base font-semibold text-foreground mb-1">Nuestro compromiso</h2>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    Nos comprometemos a superar las expectativas de nuestros clientes con atención eficiente, segura y responsable, cuidando la salud y el medio ambiente.
                               
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cuadro blanco corrido: Trabajá con nosotros */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
          <div className="bg-card border-2 border-border p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className="shrink-0 size-14 md:size-16 bg-muted flex items-center justify-center">
                  <div className="size-7 md:size-8 border-t-4 border-l-4 border-primary"></div>
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
                    Trabajá con nosotros
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Esta es la página oficial de postulaciones de Simach. Dejanos tu perfil y te contactamos cuando surja una oportunidad.
                  </p>
                </div>
              </div>
              <a
                href="#postulacion"
                className="shrink-0 self-start md:self-center group relative inline-flex items-center gap-4 bg-card border-2 border-foreground px-8 py-4 overflow-hidden transition-all"
              >
                <span className="relative z-10 font-bold tracking-wide text-foreground group-hover:text-background transition-colors text-sm">
                  Enviar Currículum
                </span>
                <div className="absolute inset-0 bg-foreground translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-10 md:py-12 bg-muted">
          <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map(f => (
              <div key={f.title} className="flex flex-col items-center text-center gap-2">
                <div className="rounded-full p-3 bg-primary">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Búsquedas activas */}
        <ActiveOpenings />

        {/* Form */}
        <section id="postulacion" className="py-16 bg-background scroll-mt-24">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="flex flex-col items-center text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Formulario de Postulación</h2>
              <p className="text-muted-foreground mt-2">
                Podés postularte a una búsqueda activa o dejarnos tus datos para futuras oportunidades. Tu perfil quedará registrado en nuestra base de candidatos.
              </p>
            </div>
            <div className="bg-card rounded-xl shadow-lg border p-6 md:p-10">
              <ApplicationForm />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-secondary">
        <div className="container mx-auto px-4 text-center space-y-2">
          <p className="text-secondary-foreground/90 text-sm">
            Autoelevadores Hangcha | Excavadoras Sunward | Servicios Industriales | Rental de Equipos
          </p>
          <p className="text-secondary-foreground text-sm font-medium">
            <a href="https://www.simach.com.ar" className="hover:text-primary transition-colors">WWW.SIMACH.COM.AR</a>
            {" — "}
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
