export type ProductId =
  | "poster" | "poster-a4"
  | "newsletter" | "newsletter-classic"
  | "boze-narodzenie-zestaw" | "boze-narodzenie-plakaty"
  | "zima-plakaty" | "zima-szablony"
  | "walentynki-plakaty" | "walentynki-szablony"
  | "dzien-kobiet-plakaty" | "dzien-kobiet-szablony"
  | "dzien-ziemi-plakaty" | "dzien-ziemi-szablony"
  | "wielkanoc-plakaty" | "wielkanoc-szablony"
  | "pierwszy-dzien-wiosny-plakaty" | "pierwszy-dzien-wiosny-szablony"
  | "wiosna-plakaty" | "wiosna-szablony"
  | "dzien-matki-plakaty" | "dzien-matki-szablony"
  | "konstytucja-plakaty" | "konstytucja-szablony"
  | "dzien-dziecka-plakaty" | "dzien-dziecka-szablony"
  | "dzien-ojca-plakaty" | "dzien-ojca-szablony"
  | "lato-plakaty" | "lato-szablony"
  | "poczatek-roku-plakaty" | "poczatek-roku-szablony"
  | "dzien-nauczyciela-plakaty" | "dzien-nauczyciela-szablony"
  | "jesien-plakaty" | "jesien-szablony"
  | "halloween-plakaty" | "halloween-szablony"
  | "andrzejki-plakaty" | "andrzejki-szablony"
  | "mikolajki-plakaty" | "mikolajki-szablony"
  | "dzien-babci-plakaty" | "dzien-babci-szablony"
  | "niepodleglosc-plakaty" | "niepodleglosc-szablony"
  | "zakonczenie-roku-plakaty" | "zakonczenie-roku-szablony";

export type CategoryId =
  | "plakaty" | "szablony"
  | "boze-narodzenie" | "zima"
  | "walentynki" | "dzien-kobiet"
  | "dzien-ziemi" | "wielkanoc"
  | "pierwszy-dzien-wiosny" | "wiosna"
  | "dzien-matki" | "konstytucja-3-maja"
  | "dzien-dziecka" | "dzien-ojca"
  | "lato" | "poczatek-roku"
  | "dzien-nauczyciela" | "jesien"
  | "halloween" | "andrzejki"
  | "mikolajki" | "dzien-babci-dziadka"
  | "niepodleglosc" | "zakonczenie-roku";

export type StoreProduct = {
  id: ProductId;
  name: string;
  description: string;
  price: number;
  image: string;
};

export type StoreCategory = {
  id: CategoryId;
  name: string;
  description: string;
  image: string;
  imageWebp: string;
  imageAlt: string;
  features: string[];
  products: StoreProduct[];
};

const CAT_IMAGES: Record<string, string> = {
  "plakaty": new URL("../img/products/cat-plakaty.svg", import.meta.url).href,
  "szablony": new URL("../img/products/cat-szablony.svg", import.meta.url).href,
  "boze-narodzenie": new URL("../img/products/cat-boze-narodzenie.svg", import.meta.url).href,
  "zima": new URL("../img/products/cat-zima.svg", import.meta.url).href,
  "walentynki": new URL("../img/products/cat-walentynki.svg", import.meta.url).href,
  "dzien-kobiet": new URL("../img/products/cat-dzien-kobiet.svg", import.meta.url).href,
  "dzien-ziemi": new URL("../img/products/cat-dzien-ziemi.svg", import.meta.url).href,
  "wielkanoc": new URL("../img/products/cat-wielkanoc.svg", import.meta.url).href,
  "pierwszy-dzien-wiosny": new URL("../img/products/cat-pierwszy-dzien-wiosny.svg", import.meta.url).href,
  "wiosna": new URL("../img/products/cat-wiosna.svg", import.meta.url).href,
  "dzien-matki": new URL("../img/products/cat-dzien-matki.svg", import.meta.url).href,
  "konstytucja-3-maja": new URL("../img/products/cat-konstytucja-3-maja.svg", import.meta.url).href,
  "dzien-dziecka": new URL("../img/products/cat-dzien-dziecka.svg", import.meta.url).href,
  "dzien-ojca": new URL("../img/products/cat-dzien-ojca.svg", import.meta.url).href,
  "lato": new URL("../img/products/cat-lato.svg", import.meta.url).href,
  "zakonczenie-roku": new URL("../img/products/cat-zakonczenie-roku.svg", import.meta.url).href,
  "poczatek-roku": new URL("../img/products/cat-poczatek-roku.svg", import.meta.url).href,
  "jesien": new URL("../img/products/cat-jesien.svg", import.meta.url).href,
  "dzien-nauczyciela": new URL("../img/products/cat-dzien-nauczyciela.svg", import.meta.url).href,
  "halloween": new URL("../img/products/cat-halloween.svg", import.meta.url).href,
  "andrzejki": new URL("../img/products/cat-andrzejki.svg", import.meta.url).href,
  "mikolajki": new URL("../img/products/cat-mikolajki.svg", import.meta.url).href,
  "dzien-babci-dziadka": new URL("../img/products/cat-dzien-babci-dziadka.svg", import.meta.url).href,
  "niepodleglosc": new URL("../img/products/cat-niepodleglosc.svg", import.meta.url).href,
};

const PROD_IMAGES: Record<string, string> = {
  "poster":                         new URL("../img/products/prod-poster.svg", import.meta.url).href,
  "poster-a4":                      new URL("../img/products/prod-poster-a4.svg", import.meta.url).href,
  "newsletter":                     new URL("../img/products/prod-newsletter.svg", import.meta.url).href,
  "newsletter-classic":             new URL("../img/products/prod-newsletter-classic.svg", import.meta.url).href,
  "boze-narodzenie-zestaw":         new URL("../img/products/prod-boze-narodzenie-zestaw.svg", import.meta.url).href,
  "boze-narodzenie-plakaty":        new URL("../img/products/prod-boze-narodzenie-plakaty.svg", import.meta.url).href,
  "zima-plakaty":                   new URL("../img/products/prod-zima-plakaty.svg", import.meta.url).href,
  "zima-szablony":                  new URL("../img/products/prod-zima-szablony.svg", import.meta.url).href,
  "walentynki-plakaty":             new URL("../img/products/prod-walentynki-plakaty.svg", import.meta.url).href,
  "walentynki-szablony":            new URL("../img/products/prod-walentynki-szablony.svg", import.meta.url).href,
  "dzien-kobiet-plakaty":           new URL("../img/products/prod-dzien-kobiet-plakaty.svg", import.meta.url).href,
  "dzien-kobiet-szablony":          new URL("../img/products/prod-dzien-kobiet-szablony.svg", import.meta.url).href,
  "dzien-ziemi-plakaty":            new URL("../img/products/prod-dzien-ziemi-plakaty.svg", import.meta.url).href,
  "dzien-ziemi-szablony":           new URL("../img/products/prod-dzien-ziemi-szablony.svg", import.meta.url).href,
  "wielkanoc-plakaty":              new URL("../img/products/prod-wielkanoc-plakaty.svg", import.meta.url).href,
  "wielkanoc-szablony":             new URL("../img/products/prod-wielkanoc-szablony.svg", import.meta.url).href,
  "pierwszy-dzien-wiosny-plakaty":  new URL("../img/products/prod-pierwszy-dzien-wiosny-plakaty.svg", import.meta.url).href,
  "pierwszy-dzien-wiosny-szablony": new URL("../img/products/prod-pierwszy-dzien-wiosny-szablony.svg", import.meta.url).href,
  "wiosna-plakaty":                 new URL("../img/products/prod-wiosna-plakaty.svg", import.meta.url).href,
  "wiosna-szablony":                new URL("../img/products/prod-wiosna-szablony.svg", import.meta.url).href,
  "dzien-matki-plakaty":            new URL("../img/products/prod-dzien-matki-plakaty.svg", import.meta.url).href,
  "dzien-matki-szablony":           new URL("../img/products/prod-dzien-matki-szablony.svg", import.meta.url).href,
  "konstytucja-plakaty":            new URL("../img/products/prod-konstytucja-plakaty.svg", import.meta.url).href,
  "konstytucja-szablony":           new URL("../img/products/prod-konstytucja-szablony.svg", import.meta.url).href,
  "dzien-dziecka-plakaty":          new URL("../img/products/prod-dzien-dziecka-plakaty.svg", import.meta.url).href,
  "dzien-dziecka-szablony":         new URL("../img/products/prod-dzien-dziecka-szablony.svg", import.meta.url).href,
  "dzien-ojca-plakaty":             new URL("../img/products/prod-dzien-ojca-plakaty.svg", import.meta.url).href,
  "dzien-ojca-szablony":            new URL("../img/products/prod-dzien-ojca-szablony.svg", import.meta.url).href,
  "lato-plakaty":                   new URL("../img/products/prod-lato-plakaty.svg", import.meta.url).href,
  "lato-szablony":                  new URL("../img/products/prod-lato-szablony.svg", import.meta.url).href,
  "zakonczenie-roku-plakaty":       new URL("../img/products/prod-zakonczenie-roku-plakaty.svg", import.meta.url).href,
  "zakonczenie-roku-szablony":      new URL("../img/products/prod-zakonczenie-roku-szablony.svg", import.meta.url).href,
  "poczatek-roku-plakaty":          new URL("../img/products/prod-poczatek-roku-plakaty.svg", import.meta.url).href,
  "poczatek-roku-szablony":         new URL("../img/products/prod-poczatek-roku-szablony.svg", import.meta.url).href,
  "jesien-plakaty":                 new URL("../img/products/prod-jesien-plakaty.svg", import.meta.url).href,
  "jesien-szablony":                new URL("../img/products/prod-jesien-szablony.svg", import.meta.url).href,
  "dzien-nauczyciela-plakaty":      new URL("../img/products/prod-dzien-nauczyciela-plakaty.svg", import.meta.url).href,
  "dzien-nauczyciela-szablony":     new URL("../img/products/prod-dzien-nauczyciela-szablony.svg", import.meta.url).href,
  "halloween-plakaty":              new URL("../img/products/prod-halloween-plakaty.svg", import.meta.url).href,
  "halloween-szablony":             new URL("../img/products/prod-halloween-szablony.svg", import.meta.url).href,
  "andrzejki-plakaty":              new URL("../img/products/prod-andrzejki-plakaty.svg", import.meta.url).href,
  "andrzejki-szablony":             new URL("../img/products/prod-andrzejki-szablony.svg", import.meta.url).href,
  "mikolajki-plakaty":              new URL("../img/products/prod-mikolajki-plakaty.svg", import.meta.url).href,
  "mikolajki-szablony":             new URL("../img/products/prod-mikolajki-szablony.svg", import.meta.url).href,
  "dzien-babci-plakaty":            new URL("../img/products/prod-dzien-babci-plakaty.svg", import.meta.url).href,
  "dzien-babci-szablony":           new URL("../img/products/prod-dzien-babci-szablony.svg", import.meta.url).href,
  "niepodleglosc-plakaty":          new URL("../img/products/prod-niepodleglosc-plakaty.svg", import.meta.url).href,
  "niepodleglosc-szablony":         new URL("../img/products/prod-niepodleglosc-szablony.svg", import.meta.url).href,  "poster-wariant3":                  new URL("../img/products/prod-poster-wariant3-v1.svg", import.meta.url).href,
  "newsletter-wariant3":              new URL("../img/products/prod-newsletter-wariant3-v1.svg", import.meta.url).href,
  "boze-narodzenie-wariant3":         new URL("../img/products/prod-boze-narodzenie-wariant3-v1.svg", import.meta.url).href,
  "zima-wariant3":                    new URL("../img/products/prod-zima-wariant3-v1.svg", import.meta.url).href,
  "mikolajki-wariant3":               new URL("../img/products/prod-mikolajki-wariant3-v1.svg", import.meta.url).href,
  "walentynki-wariant3":              new URL("../img/products/prod-walentynki-wariant3-v1.svg", import.meta.url).href,
  "dzien-babci-wariant3":             new URL("../img/products/prod-dzien-babci-wariant3-v1.svg", import.meta.url).href,
  "dzien-kobiet-wariant3":            new URL("../img/products/prod-dzien-kobiet-wariant3-v1.svg", import.meta.url).href,
  "dzien-ziemi-wariant3":             new URL("../img/products/prod-dzien-ziemi-wariant3-v1.svg", import.meta.url).href,
  "wielkanoc-wariant3":               new URL("../img/products/prod-wielkanoc-wariant3-v1.svg", import.meta.url).href,
  "pierwszy-dzien-wiosny-wariant3":   new URL("../img/products/prod-pierwszy-dzien-wiosny-wariant3-v1.svg", import.meta.url).href,
  "wiosna-wariant3":                  new URL("../img/products/prod-wiosna-wariant3-v1.svg", import.meta.url).href,
  "dzien-matki-wariant3":             new URL("../img/products/prod-dzien-matki-wariant3-v1.svg", import.meta.url).href,
  "konstytucja-wariant3":             new URL("../img/products/prod-konstytucja-wariant3-v1.svg", import.meta.url).href,
  "dzien-dziecka-wariant3":           new URL("../img/products/prod-dzien-dziecka-wariant3-v1.svg", import.meta.url).href,
  "dzien-ojca-wariant3":              new URL("../img/products/prod-dzien-ojca-wariant3-v1.svg", import.meta.url).href,
  "lato-wariant3":                    new URL("../img/products/prod-lato-wariant3-v1.svg", import.meta.url).href,
  "zakonczenie-roku-wariant3":        new URL("../img/products/prod-zakonczenie-roku-wariant3-v1.svg", import.meta.url).href,
  "poczatek-roku-wariant3":           new URL("../img/products/prod-poczatek-roku-wariant3-v1.svg", import.meta.url).href,
  "jesien-wariant3":                  new URL("../img/products/prod-jesien-wariant3-v1.svg", import.meta.url).href,
  "dzien-nauczyciela-wariant3":       new URL("../img/products/prod-dzien-nauczyciela-wariant3-v1.svg", import.meta.url).href,
  "halloween-wariant3":               new URL("../img/products/prod-halloween-wariant3-v1.svg", import.meta.url).href,
  "andrzejki-wariant3":               new URL("../img/products/prod-andrzejki-wariant3-v1.svg", import.meta.url).href,
  "niepodleglosc-wariant3":           new URL("../img/products/prod-niepodleglosc-wariant3-v1.svg", import.meta.url).href,};

export const STORE_CONFIG = {
  categories: [
    {
      id: "plakaty",
      name: "Plakaty szkolne",
      description: "Wyjątkowe plakaty, które odmienią każdą klasę i korytarz. Stworzone z myślą o nauczycielach, którzy cenią estetykę i wygodę – wystarczy wydrukować i powiesić, by w kilka chwil stworzyć inspirującą przestrzeń.",
      image: CAT_IMAGES["plakaty"],
      imageWebp: CAT_IMAGES["plakaty"],
      imageAlt: "Plakaty szkolne PDF",
      features: [
        "Plakaty do klasy i na korytarz w różnych formatach",
        "Motywy dopasowane do szkolnych wydarzeń i sezonów",
        "Kolorystyka dopasowana do szkolnych wnętrz",
        "Gotowe do natychmiastowego wywieszenia"
      ],
      products: [
        { id: "poster",          name: "Wariant 1", description: "12 plakatów A3 w żywych kolorach – gotowe do druku i natychmiastowego wywieszenia.", price: 45, image: PROD_IMAGES["poster"] },
        { id: "poster-a4",       name: "Wariant 2", description: "12 plakatów A4 – wygodny format do tablic, zeszytów i gazetki klasowej.", price: 35, image: PROD_IMAGES["poster-a4"] },
        { id: "poster-wariant3", name: "Wariant 3", description: "Zestaw premium: 12 plakatów A3 i A4 łącznie z dodatkowymi stronami tytułowymi.", price: 55, image: PROD_IMAGES["poster-wariant3"] },
      ],
    },
    {
      id: "szablony",
      name: "Szablony gazetki",
      description: "Nowoczesne szablony, które ułatwią przygotowanie każdej gazetki szkolnej. Oszczędzają czas, porządkują treści i pozwalają każdemu numerowi wyglądać profesjonalnie – nawet jeśli robisz gazetkę po raz pierwszy.",
      image: CAT_IMAGES["szablony"],
      imageWebp: CAT_IMAGES["szablony"],
      imageAlt: "Szablony gazetki PDF",
      features: [
        "Gotowe kolumny i ramki do szybkiego składania numeru",
        "Układy na krótkie i długie treści",
        "Nowoczesna, czytelna typografia ułatwiająca odbiór",
        "Łatwe do wydruku lub prezentacji online"
      ],
      products: [
        { id: "newsletter",          name: "Wariant 1", description: "Nowoczesny układ gazetki z dynamicznymi ramkami i miejscem na zdjęcia.", price: 52, image: PROD_IMAGES["newsletter"] },
        { id: "newsletter-classic",  name: "Wariant 2", description: "Klasyczny dwukolumnowy układ – czytelny, elegancki i sprawdzony w każdej szkole.", price: 45, image: PROD_IMAGES["newsletter-classic"] },
        { id: "newsletter-wariant3", name: "Wariant 3", description: "Układ premium z bogatą stroną tytułową, stopką redakcji i 6 różnymi layoutami.", price: 58, image: PROD_IMAGES["newsletter-wariant3"] },
      ],
    },
    {
      id: "boze-narodzenie",
      name: "Boże Narodzenie",
      description: "Świąteczne materiały z ciepłym klimatem klasy - idealne na grudniową oprawę szkoły i wydarzeń.",
      image: CAT_IMAGES["boze-narodzenie"],
      imageWebp: CAT_IMAGES["boze-narodzenie"],
      imageAlt: "Gazetka szkolna Boże Narodzenie PDF",
      features: ["Świąteczne grafiki z choinką, lampkami i śniegiem", "Strona na klasowe życzenia i świąteczne ogłoszenia", "Inspiracje na świąteczne konkursy i zabawy", "Motywy zimowej atmosfery"],
      products: [
        { id: "boze-narodzenie-zestaw",   name: "Wariant 1", description: "Kompletny zestaw świąteczny: plakaty A3 + szablony gazetki z choinką i śniegiem.", price: 55, image: PROD_IMAGES["boze-narodzenie-zestaw"] },
        { id: "boze-narodzenie-plakaty",  name: "Wariant 2", description: "8 plakatów A3/A4 z ciepłymi ilustracjami bożonarodzeniowymi – na korytarz i salę.", price: 40, image: PROD_IMAGES["boze-narodzenie-plakaty"] },
        { id: "boze-narodzenie-wariant3", name: "Wariant 3", description: "Rozbudowany szablon gazetki świątecznej z 6 layoutami i stroną życzeń dla całej szkoły.", price: 48, image: PROD_IMAGES["boze-narodzenie-wariant3"] },
      ],
    },
    {
      id: "zima",
      name: "Zima",
      description: "Zimowe zestawy na styczeń i luty - ferie, śnieg i gotowe treści do sezonowej gazetki.",
      image: CAT_IMAGES["zima"],
      imageWebp: CAT_IMAGES["zima"],
      imageAlt: "Gazetka szkolna Zima PDF",
      features: ["Bałwany, śnieg i zimowe krajobrazy", "Pomysły na ferie i zimowe aktywności", "Miejsce na relacje z zabaw na śniegu", "Zimowe tła i ramki do gazetki"],
      products: [
        { id: "zima-plakaty",  name: "Wariant 1", description: "8 plakatów z mrozem, śniegiem i bałwanem – dekoracja korytarza na zimę i ferie.", price: 38, image: PROD_IMAGES["zima-plakaty"] },
        { id: "zima-szablony", name: "Wariant 2", description: "Zimowy układ gazetki z gotowymi ramkami, nagłówkami i tłami dla redakcji.", price: 45, image: PROD_IMAGES["zima-szablony"] },
        { id: "zima-wariant3", name: "Wariant 3", description: "Komplet zimowy: plakaty + szablony gazetki z feriami i zimowymi aktywnościami.", price: 50, image: PROD_IMAGES["zima-wariant3"] },
      ],
    },
    {
      id: "mikolajki",
      name: "Mikołajki",
      description: "Gotowa oprawa na 6 grudnia - mikołajkowy klimat, dekoracje i treści do szybkiego wdrożenia.",
      image: CAT_IMAGES["mikolajki"],
      imageWebp: CAT_IMAGES["mikolajki"],
      imageAlt: "Gazetka szkolna Mikołajki PDF",
      features: ["Ilustracje z Mikołajem i prezentami", "Pomysły na zabawy i zadania na 6 grudnia", "Miejsce na listy do Mikołaja od uczniów", "Kolorowe tła i ramki w zimowym stylu"],
      products: [
        { id: "mikolajki-plakaty",  name: "Wariant 1", description: "8 radosnych plakatów z Mikołajem i prezentami – dekoracja szkoły na 6 grudnia.", price: 38, image: PROD_IMAGES["mikolajki-plakaty"] },
        { id: "mikolajki-szablony", name: "Wariant 2", description: "Układ gazetki z mikołajkowym klimatem – nagłówki i tła w zimowych kolorach.", price: 42, image: PROD_IMAGES["mikolajki-szablony"] },
        { id: "mikolajki-wariant3", name: "Wariant 3", description: "Komplet mikołajkowy: plakaty dekoracyjne + szablon gazetki z miejscem na listy do Mikołaja.", price: 48, image: PROD_IMAGES["mikolajki-wariant3"] },
      ],
    },
    {
      id: "walentynki",
      name: "Walentynki",
      description: "Walentynkowa oprawa szkolna - serca, życzliwość i estetyczne materiały na 14 lutego.",
      image: CAT_IMAGES["walentynki"],
      imageWebp: CAT_IMAGES["walentynki"],
      imageAlt: "Gazetka szkolna Walentynki PDF",
      features: ["Serduszkowe dekoracje i motywy przyjaźni", "Miejsce na życzenia i wyznania uczniów", "Pomysły na walentynkowe konkursy", "Różowe i czerwone akcenty graficzne"],
      products: [
        { id: "walentynki-plakaty",  name: "Wariant 1", description: "8 plakatów z sercami i różowymi akcentami – dla klasy i korytarza na 14 lutego.", price: 38, image: PROD_IMAGES["walentynki-plakaty"] },
        { id: "walentynki-szablony", name: "Wariant 2", description: "Romantyczny układ gazetki z gotowymi obramowaniami i wzorami tła.", price: 42, image: PROD_IMAGES["walentynki-szablony"] },
        { id: "walentynki-wariant3", name: "Wariant 3", description: "Zestaw walentynkowy: plakaty serduszka + szablon gazetki z miejscem na uczniowskie wyznania.", price: 48, image: PROD_IMAGES["walentynki-wariant3"] },
      ],
    },
    {
      id: "dzien-babci-dziadka",
      name: "Dzień Babci i Dziadka",
      description: "Serdeczne materiały na styczeń - gotowe do laurek, podziękowań i rodzinnej gazetki klasowej.",
      image: CAT_IMAGES["dzien-babci-dziadka"],
      imageWebp: CAT_IMAGES["dzien-babci-dziadka"],
      imageAlt: "Gazetka szkolna Dzień Babci i Dziadka PDF",
      features: ["Szablony laurek i podziękowań", "Miejsce na rodzinne zdjęcia i wspomnienia", "Pomysły na klasowe wywiady z dziadkami", "Delikatne, kwiatowe dekoracje"],
      products: [
        { id: "dzien-babci-plakaty",  name: "Wariant 1", description: "8 ciepłych plakatów z różami i sercami – idealne do wydruku na 21 i 22 stycznia.", price: 38, image: PROD_IMAGES["dzien-babci-plakaty"] },
        { id: "dzien-babci-szablony", name: "Wariant 2", description: "Serdeczny układ gazetki z dekoracjami kwiatowymi – gotowy do wypełnienia życzeniami.", price: 42, image: PROD_IMAGES["dzien-babci-szablony"] },
        { id: "dzien-babci-wariant3", name: "Wariant 3", description: "Komplet: plakaty dekoracyjne + szablon gazetki z przepisem, wywiadem i galerią rysunków.", price: 48, image: PROD_IMAGES["dzien-babci-wariant3"] },
      ],
    },
    {
      id: "dzien-kobiet",
      name: "Dzień Kobiet",
      description: "Elegancka oprawa na 8 marca - kwiatowe motywy i miejsce na życzenia od uczniów.",
      image: CAT_IMAGES["dzien-kobiet"],
      imageWebp: CAT_IMAGES["dzien-kobiet"],
      imageAlt: "Gazetka szkolna Dzień Kobiet PDF",
      features: ["Kwiatowe grafiki i pastelowe tła", "Miejsce na życzenia od uczniów", "Inspiracje na klasowe świętowanie", "Motywy kobiecej siły i elegancji"],
      products: [
        { id: "dzien-kobiet-plakaty",  name: "Wariant 1", description: "8 kwiatowych plakatów z tulipanami i różami – piękna dekoracja szkoły na 8 marca.", price: 38, image: PROD_IMAGES["dzien-kobiet-plakaty"] },
        { id: "dzien-kobiet-szablony", name: "Wariant 2", description: "Elegancki układ gazetki z kwiatowymi obramowaniami i pastelowym tłem na Dzień Kobiet.", price: 42, image: PROD_IMAGES["dzien-kobiet-szablony"] },
        { id: "dzien-kobiet-wariant3", name: "Wariant 3", description: "Komplet: plakaty kwiatowe + szablon gazetki z wywiadem, galerią i stroną poświęconą kobietom.", price: 48, image: PROD_IMAGES["dzien-kobiet-wariant3"] },
      ],
    },
    {
      id: "pierwszy-dzien-wiosny",
      name: "Pierwszy Dzień Wiosny",
      description: "Gotowe materiały na 21 marca - pierwszy dzień wiosny w atrakcyjnej, szkolnej formie.",
      image: CAT_IMAGES["pierwszy-dzien-wiosny"],
      imageWebp: CAT_IMAGES["pierwszy-dzien-wiosny"],
      imageAlt: "Gazetka szkolna Pierwszy Dzień Wiosny PDF",
      features: ["Marzanna, kwiaty i motyle", "Kolorowe tła na powitanie wiosny", "Pomysły na wiosenne quizy i zabawy", "Miejsce na zdjęcia z klasowych obchodów"],
      products: [
        { id: "pierwszy-dzien-wiosny-plakaty",  name: "Wariant 1", description: "8 świeżych plakatów z kwiatami i motylami – kolorowa dekoracja klasy na powitanie wiosny.", price: 38, image: PROD_IMAGES["pierwszy-dzien-wiosny-plakaty"] },
        { id: "pierwszy-dzien-wiosny-szablony", name: "Wariant 2", description: "Wiosenny układ gazetki z zielonymi akcentami i kwiatowymi ramkami na 21 marca.", price: 42, image: PROD_IMAGES["pierwszy-dzien-wiosny-szablony"] },
        { id: "pierwszy-dzien-wiosny-wariant3", name: "Wariant 3", description: "Komplet wiosenny: plakaty + szablon gazetki z quizem przyrodniczym i galerią.", price: 48, image: PROD_IMAGES["pierwszy-dzien-wiosny-wariant3"] },
      ],
    },
    {
      id: "wielkanoc",
      name: "Wielkanoc",
      description: "Wielkanocne zestawy z pisankami i tradycją - spójna oprawa sal i korytarzy przed świętami.",
      image: CAT_IMAGES["wielkanoc"],
      imageWebp: CAT_IMAGES["wielkanoc"],
      imageAlt: "Gazetka szkolna Wielkanoc PDF",
      features: ["Pisanki, bazie i baranki", "Strona na klasowe życzenia wielkanocne", "Pomysły na świąteczne konkursy plastyczne", "Miejsce na opisy tradycji wielkanocnych"],
      products: [
        { id: "wielkanoc-plakaty",  name: "Wariant 1", description: "8 wielkanocnych plakatów z pisankami i kurczakami – radosna dekoracja szkoły przed Wielkanocą.", price: 38, image: PROD_IMAGES["wielkanoc-plakaty"] },
        { id: "wielkanoc-szablony", name: "Wariant 2", description: "Wielkanocny układ gazetki z kolorowymi pisankami w tle – gotowy do druku i wypełnienia.", price: 42, image: PROD_IMAGES["wielkanoc-szablony"] },
        { id: "wielkanoc-wariant3", name: "Wariant 3", description: "Komplet wielkanocny: plakaty + szablon gazetki z tradycjami, quizem i galerią ozdób.", price: 48, image: PROD_IMAGES["wielkanoc-wariant3"] },
      ],
    },
    {
      id: "dzien-ziemi",
      name: "Dzień Ziemi",
      description: "Tematy ekologiczne na 22 kwietnia - czytelne materiały o planecie, zasobach i dobrych nawykach.",
      image: CAT_IMAGES["dzien-ziemi"],
      imageWebp: CAT_IMAGES["dzien-ziemi"],
      imageAlt: "Gazetka szkolna Dzień Ziemi PDF",
      features: ["Eko-motywy, globus i liście", "Pomysły na ekologiczne akcje klasowe", "Miejsce na rady i ciekawostki o planecie", "Zielona, spokojna kolorystyka"],
      products: [
        { id: "dzien-ziemi-plakaty",  name: "Wariant 1", description: "8 ekologicznych plakatów z motywem Ziemi i natury – świetna dekoracja szkoły na 22 kwietnia.", price: 38, image: PROD_IMAGES["dzien-ziemi-plakaty"] },
        { id: "dzien-ziemi-szablony", name: "Wariant 2", description: "Zielony układ gazetki z liśćmi i globusem – gotowy szablon na Dzień Ziemi.", price: 42, image: PROD_IMAGES["dzien-ziemi-szablony"] },
        { id: "dzien-ziemi-wariant3", name: "Wariant 3", description: "Komplet ekologiczny: plakaty + szablon gazetki z ekoquizem, radami i galerią rysunków.", price: 48, image: PROD_IMAGES["dzien-ziemi-wariant3"] },
      ],
    },
    {
      id: "wiosna",
      name: "Wiosna",
      description: "Uniwersalne materiały wiosenne na marzec-maj - przyroda, obserwacje i sezonowe inspiracje.",
      image: CAT_IMAGES["wiosna"],
      imageWebp: CAT_IMAGES["wiosna"],
      imageAlt: "Gazetka szkolna Wiosna PDF",
      features: ["Kwiaty, ptaki i zieleń", "Inspiracje do obserwacji przyrody", "Miejsce na zdjęcia i rysunki uczniów", "Wiosenne quizy i zabawy"],
      products: [
        { id: "wiosna-plakaty",  name: "Wariant 1", description: "8 wiosennych plakatów z kwiatami i motylami – kolorowa dekoracja klasy na całą wiosnę.", price: 38, image: PROD_IMAGES["wiosna-plakaty"] },
        { id: "wiosna-szablony", name: "Wariant 2", description: "Wiosenny układ gazetki z zielonymi i żółtymi akcentami – gotowe ramki i tła.", price: 42, image: PROD_IMAGES["wiosna-szablony"] },
        { id: "wiosna-wariant3", name: "Wariant 3", description: "Komplet wiosenny: plakaty + szablon gazetki z przyrodą, quizem i miejscem na zdjęcia.", price: 48, image: PROD_IMAGES["wiosna-wariant3"] },
      ],
    },
    {
      id: "konstytucja-3-maja",
      name: "Konstytucja 3 Maja",
      description: "Patriotyczna oprawa na 3 maja - fakty historyczne i symbole narodowe gotowe do wykorzystania.",
      image: CAT_IMAGES["konstytucja-3-maja"],
      imageWebp: CAT_IMAGES["konstytucja-3-maja"],
      imageAlt: "Gazetka szkolna Konstytucja 3 Maja PDF",
      features: ["Patriotyczne symbole: flaga, orzeł, godło", "Fakty historyczne i cytaty", "Miejsce na klasowe prace o historii", "Uroczysta oprawa na apel"],
      products: [
        { id: "konstytucja-plakaty",  name: "Wariant 1", description: "8 patriotycznych plakatów z flagą, orłem i datą – uroczysta dekoracja szkoły na 3 Maja.", price: 38, image: PROD_IMAGES["konstytucja-plakaty"] },
        { id: "konstytucja-szablony", name: "Wariant 2", description: "Patriotyczny układ gazetki z biało-czerwonymi akcentami i miejscem na tekst historyczny.", price: 42, image: PROD_IMAGES["konstytucja-szablony"] },
        { id: "konstytucja-wariant3", name: "Wariant 3", description: "Komplet patriotyczny: plakaty + szablon gazetki z historią, quizem i cytatami.", price: 48, image: PROD_IMAGES["konstytucja-wariant3"] },
      ],
    },
    {
      id: "dzien-matki",
      name: "Dzień Matki",
      description: "Gotowy zestaw na 26 maja - życzenia, wiersze i oprawa prac uczniów dla mam.",
      image: CAT_IMAGES["dzien-matki"],
      imageWebp: CAT_IMAGES["dzien-matki"],
      imageAlt: "Gazetka szkolna Dzień Matki PDF",
      features: ["Kwiaty, serca i dedykacje dla mam", "Miejsce na życzenia i wiersze", "Pomysły na klasowe laurki", "Galeria prac uczniów dla mam"],
      products: [
        { id: "dzien-matki-plakaty",  name: "Wariant 1", description: "8 ciepłych plakatów z bukietami i sercami – wyjątkowa dekoracja klasy na Dzień Matki.", price: 38, image: PROD_IMAGES["dzien-matki-plakaty"] },
        { id: "dzien-matki-szablony", name: "Wariant 2", description: "Kwiatowy układ gazetki z miejscem na życzenia i wierszyk – gotowy do druku na 26 maja.", price: 42, image: PROD_IMAGES["dzien-matki-szablony"] },
        { id: "dzien-matki-wariant3", name: "Wariant 3", description: "Komplet: plakaty + szablon gazetki z wierszem, wywiadem i galerią dla Mamy.", price: 48, image: PROD_IMAGES["dzien-matki-wariant3"] },
      ],
    },
    {
      id: "dzien-dziecka",
      name: "Dzień Dziecka",
      description: "Radosna oprawa na 1 czerwca - kolorowe materiały, zabawy i treści dla całej klasy.",
      image: CAT_IMAGES["dzien-dziecka"],
      imageWebp: CAT_IMAGES["dzien-dziecka"],
      imageAlt: "Gazetka szkolna Dzień Dziecka PDF",
      features: ["Balony, confetti i uśmiech", "Pomysły na zabawy i konkursy", "Miejsce na życzenia i rysunki dzieci", "Kolorowa, energetyczna oprawa"],
      products: [
        { id: "dzien-dziecka-plakaty",  name: "Wariant 1", description: "8 kolorowych plakatów z balonami i gwiazdkami – idealne do dekoracji szkoły na 1 czerwca.", price: 38, image: PROD_IMAGES["dzien-dziecka-plakaty"] },
        { id: "dzien-dziecka-szablony", name: "Wariant 2", description: "Radosny układ gazetki z confetti i balonami w tle – gotowy szablon na Dzień Dziecka.", price: 42, image: PROD_IMAGES["dzien-dziecka-szablony"] },
        { id: "dzien-dziecka-wariant3", name: "Wariant 3", description: "Komplet: plakaty kolorowe + szablon gazetki z zabawami, quizem i życzeniami.", price: 48, image: PROD_IMAGES["dzien-dziecka-wariant3"] },
      ],
    },
    {
      id: "dzien-ojca",
      name: "Dzień Ojca",
      description: "Materiały na 23 czerwca - podziękowania dla taty i miejsce na dedykacje uczniów.",
      image: CAT_IMAGES["dzien-ojca"],
      imageWebp: CAT_IMAGES["dzien-ojca"],
      imageAlt: "Gazetka szkolna Dzień Ojca PDF",
      features: ["Podziękowania i dedykacje dla taty", "Miejsce na życzenia i wywiady", "Pomysły na klasowe laurki", "Galeria prac uczniów dla taty"],
      products: [
        { id: "dzien-ojca-plakaty",  name: "Wariant 1", description: "8 serdecznych plakatów dla taty – dekoracja klasy i korytarza na Dzień Ojca.", price: 38, image: PROD_IMAGES["dzien-ojca-plakaty"] },
        { id: "dzien-ojca-szablony", name: "Wariant 2", description: "Elegancki układ gazetki z miejscem na życzenia dla taty – gotowy do druku na 23 czerwca.", price: 42, image: PROD_IMAGES["dzien-ojca-szablony"] },
        { id: "dzien-ojca-wariant3", name: "Wariant 3", description: "Komplet: plakaty + szablon gazetki z wywiadem, wierszem i galerią dla Taty.", price: 48, image: PROD_IMAGES["dzien-ojca-wariant3"] },
      ],
    },
    {
      id: "lato",
      name: "Lato",
      description: "Letnie materiały na czerwiec - wakacyjne motywy i lekka oprawa końcówki roku.",
      image: CAT_IMAGES["lato"],
      imageWebp: CAT_IMAGES["lato"],
      imageAlt: "Gazetka szkolna Lato PDF",
      features: ["Słońce, plaża i wakacyjne motywy", "Pomysły na plany wakacyjne", "Miejsce na wspomnienia z końca roku", "Letnia, jasna kolorystyka"],
      products: [
        { id: "lato-plakaty",  name: "Wariant 1", description: "8 słonecznych plakatów z plażą i wakacjami – kolorowa dekoracja szkoły na koniec roku.", price: 38, image: PROD_IMAGES["lato-plakaty"] },
        { id: "lato-szablony", name: "Wariant 2", description: "Letni układ gazetki z falami i słońcem – idealny na czerwiec i zakończenie roku.", price: 42, image: PROD_IMAGES["lato-szablony"] },
        { id: "lato-wariant3", name: "Wariant 3", description: "Komplet letni: plakaty + szablon gazetki z wakacyjnymi planami i galeriami.", price: 48, image: PROD_IMAGES["lato-wariant3"] },
      ],
    },
    {
      id: "zakonczenie-roku",
      name: "Zakończenie roku szkolnego",
      description: "Komplet na zakończenie roku - osiągnięcia klasy, podziękowania i pożegnalna kronika.",
      image: CAT_IMAGES["zakonczenie-roku"],
      imageWebp: CAT_IMAGES["zakonczenie-roku"],
      imageAlt: "Gazetka szkolna Zakończenie roku PDF",
      features: ["Dyplomy i podziękowania dla uczniów", "Miejsce na wspomnienia i kronikę klasy", "Pomysły na pożegnalne życzenia", "Uroczysta oprawa na zakończenie roku"],
      products: [
        { id: "zakonczenie-roku-plakaty",  name: "Wariant 1", description: "8 uroczystych plakatów z biretami i dyplomami – piękna dekoracja na zakończenie roku szkolnego.", price: 42, image: PROD_IMAGES["zakonczenie-roku-plakaty"] },
        { id: "zakonczenie-roku-szablony", name: "Wariant 2", description: "Uroczysty układ gazetki z miejscem na wspomnienia, ranking i życzenia na wakacje.", price: 48, image: PROD_IMAGES["zakonczenie-roku-szablony"] },
        { id: "zakonczenie-roku-wariant3", name: "Wariant 3", description: "Komplet pożegnalny: plakaty + szablon gazetki z kroną roku, wspomnieniami i planami.", price: 54, image: PROD_IMAGES["zakonczenie-roku-wariant3"] },
      ],
    },
    {
      id: "poczatek-roku",
      name: "Początek roku szkolnego",
      description: "Wrześniowy pakiet startowy - powitanie uczniów, organizacja klasy i szybki start gazetki.",
      image: CAT_IMAGES["poczatek-roku"],
      imageWebp: CAT_IMAGES["poczatek-roku"],
      imageAlt: "Gazetka szkolna Początek roku PDF",
      features: ["Powrót do szkoły z energią", "Plan lekcji i organizacja klasy", "Miejsce na przedstawienie redakcji", "Kolorowa oprawa na start roku"],
      products: [
        { id: "poczatek-roku-plakaty",  name: "Wariant 1", description: "8 plakatów powitalnych z tornistrem i książkami – kolorowa dekoracja szkoły na 1 września.", price: 38, image: PROD_IMAGES["poczatek-roku-plakaty"] },
        { id: "poczatek-roku-szablony", name: "Wariant 2", description: "Szkolny układ gazetki na nowy rok – plan lekcji, przedstawienie redakcji i miejsce na newsy.", price: 42, image: PROD_IMAGES["poczatek-roku-szablony"] },
        { id: "poczatek-roku-wariant3", name: "Wariant 3", description: "Komplet powitalny: plakaty + szablon gazetki z regułami klasy, quizem i celami roku.", price: 48, image: PROD_IMAGES["poczatek-roku-wariant3"] },
      ],
    },
    {
      id: "jesien",
      name: "Jesień",
      description: "Jesienna oprawa na wrzesień-listopad - dary jesieni, przyroda i ciepła kolorystyka.",
      image: CAT_IMAGES["jesien"],
      imageWebp: CAT_IMAGES["jesien"],
      imageAlt: "Gazetka szkolna Jesień PDF",
      features: ["Liście, grzyby i kasztany", "Pomysły na jesienne obserwacje przyrody", "Miejsce na przepisy i galerie liści", "Ciepła, złota kolorystyka"],
      products: [
        { id: "jesien-plakaty",  name: "Wariant 1", description: "8 jesiennych plakatów z liśćmi i grzybami – złota dekoracja klasy na wrzesień i październik.", price: 38, image: PROD_IMAGES["jesien-plakaty"] },
        { id: "jesien-szablony", name: "Wariant 2", description: "Jesienny układ gazetki z ciepłą kolorystyką – gotowe obramowania w odcieniach złota i brązu.", price: 42, image: PROD_IMAGES["jesien-szablony"] },
        { id: "jesien-wariant3", name: "Wariant 3", description: "Komplet jesienny: plakaty + szablon gazetki z przyrodą, przepisem i galerią liści.", price: 48, image: PROD_IMAGES["jesien-wariant3"] },
      ],
    },
    {
      id: "dzien-nauczyciela",
      name: "Dzień Nauczyciela",
      description: "Gotowe zestawy na 14 października - podziękowania i elegancka oprawa Dnia Nauczyciela.",
      image: CAT_IMAGES["dzien-nauczyciela"],
      imageWebp: CAT_IMAGES["dzien-nauczyciela"],
      imageAlt: "Gazetka szkolna Dzień Nauczyciela PDF",
      features: ["Podziękowania i motywy szkolne", "Miejsce na sylwetki nauczycieli", "Pomysły na klasowe życzenia", "Ciepła, elegancka oprawa"],
      products: [
        { id: "dzien-nauczyciela-plakaty",  name: "Wariant 1", description: "8 eleganckich plakatów z jabłkiem i książką – wyjątkowa dekoracja szkoły na 14 października.", price: 38, image: PROD_IMAGES["dzien-nauczyciela-plakaty"] },
        { id: "dzien-nauczyciela-szablony", name: "Wariant 2", description: "Układ gazetki z miejscem na podziękowania i sylwetki nauczycielskie – ciepły styl edukacyjny.", price: 42, image: PROD_IMAGES["dzien-nauczyciela-szablony"] },
        { id: "dzien-nauczyciela-wariant3", name: "Wariant 3", description: "Komplet: plakaty + szablon gazetki z wywiadem z nauczycielem i galerią wspomnień.", price: 48, image: PROD_IMAGES["dzien-nauczyciela-wariant3"] },
      ],
    },
    {
      id: "halloween",
      name: "Halloween",
      description: "Halloween w szkolnym wydaniu - dynie, łagodne straszki i gotowy klimat na koniec października.",
      image: CAT_IMAGES["halloween"],
      imageWebp: CAT_IMAGES["halloween"],
      imageAlt: "Gazetka szkolna Halloween PDF",
      features: ["Dynie, duchy i pajęczyny", "Pomysły na halloweenowe zabawy", "Miejsce na galerię kostiumów", "Mroczne, ale łagodne motywy"],
      products: [
        { id: "halloween-plakaty",  name: "Wariant 1", description: "8 strasznych plakatów z dynią i duchem – halloweenowa dekoracja szkoły na 31 października.", price: 38, image: PROD_IMAGES["halloween-plakaty"] },
        { id: "halloween-szablony", name: "Wariant 2", description: "Mroczny układ gazetki z pajęczynami i duchem w tle – gotowy do zastraszania czytelników.", price: 42, image: PROD_IMAGES["halloween-szablony"] },
        { id: "halloween-wariant3", name: "Wariant 3", description: "Komplet Halloween: plakaty + szablon gazetki z wróżbami, quizem i galerią kostiumów.", price: 48, image: PROD_IMAGES["halloween-wariant3"] },
      ],
    },
    {
      id: "andrzejki",
      name: "Andrzejki",
      description: "Andrzejkowa oprawa klasy - wróżby, zabawy i materiały gotowe na 30 listopada.",
      image: CAT_IMAGES["andrzejki"],
      imageWebp: CAT_IMAGES["andrzejki"],
      imageAlt: "Gazetka szkolna Andrzejki PDF",
      features: ["Wróżby, gwiazdy i światło świec", "Pomysły na zabawy andrzejkowe", "Miejsce na relacje i zdjęcia z imprezy", "Mistyczny klimat i kolory"],
      products: [
        { id: "andrzejki-plakaty",  name: "Wariant 1", description: "8 tajemniczych plakatów z kulą, gwiazdami i wróżbami – klimatyczna dekoracja na 30 listopada.", price: 38, image: PROD_IMAGES["andrzejki-plakaty"] },
        { id: "andrzejki-szablony", name: "Wariant 2", description: "Mistyczny układ gazetki z miejscem na wróżby i zdjęcia z andrzejkowej zabawy szkolnej.", price: 42, image: PROD_IMAGES["andrzejki-szablony"] },
        { id: "andrzejki-wariant3", name: "Wariant 3", description: "Komplet andrzejkowy: plakaty + szablon gazetki z quizem, relacją i przepisami na noc wróżb.", price: 48, image: PROD_IMAGES["andrzejki-wariant3"] },
      ],
    },
    {
      id: "niepodleglosc",
      name: "Dzień Niepodległości",
      description: "Oprawa na 11 listopada - historia niepodległości i symbole narodowe w gotowej formie.",
      image: CAT_IMAGES["niepodleglosc"],
      imageWebp: CAT_IMAGES["niepodleglosc"],
      imageAlt: "Gazetka szkolna Dzień Niepodległości PDF",
      features: ["Patriotyczne symbole: flaga, orzeł", "Fakty i ciekawostki historyczne", "Miejsce na prace uczniów o niepodległości", "Uroczysta oprawa na 11 listopada"],
      products: [
        { id: "niepodleglosc-plakaty",  name: "Wariant 1", description: "8 patriotycznych plakatów z orłem i flagą – uroczysta dekoracja szkoły na Dzień Niepodległości.", price: 38, image: PROD_IMAGES["niepodleglosc-plakaty"] },
        { id: "niepodleglosc-szablony", name: "Wariant 2", description: "Patriotyczny układ gazetki z biało-czerwonymi akcentami i miejscem na historyczne treści.", price: 42, image: PROD_IMAGES["niepodleglosc-szablony"] },
        { id: "niepodleglosc-wariant3", name: "Wariant 3", description: "Komplet patriotyczny: plakaty + szablon gazetki z historią, mapą i quizem o niepodległości.", price: 48, image: PROD_IMAGES["niepodleglosc-wariant3"] },
      ],
    },
  ] as StoreCategory[],
  contact: {
    phoneDisplay: "794 535 366",
    phoneHref: "tel:+48794535366",
    generalEmail: "zamowienia@szkolnegazetki.pl",
    complaintsEmail: "reklamacje@szkolnegazetki.pl",
    fulfillmentHours:
      "Obsługa zamówień od poniedziałku do piątku: 09:00-18:00.",
  },
  payment: {
    accountHolder: "Szkolne gazetki",
    accountNumber: "60 1140 2004 0000 3102 4831 8846",
    blikPhone: "794 535 366",
  },
} as const;

export type CategoryGroup = {
  id: string;
  label: string;
  categoryIds: CategoryId[];
};

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: "caloroczne",
    label: "Całoroczne",
    categoryIds: ["plakaty", "szablony"],
  },
  {
    id: "jesien",
    label: "Jesień",
    categoryIds: ["poczatek-roku", "jesien", "dzien-nauczyciela", "halloween", "andrzejki", "niepodleglosc"],
  },
  {
    id: "zima",
    label: "Zima",
    categoryIds: ["mikolajki", "boze-narodzenie", "zima"],
  },
  {
    id: "wiosna",
    label: "Wiosna",
    categoryIds: [
      "walentynki", "dzien-babci-dziadka", "dzien-kobiet",
      "pierwszy-dzien-wiosny", "wielkanoc", "dzien-ziemi",
      "wiosna", "konstytucja-3-maja", "dzien-matki",
      "dzien-dziecka", "dzien-ojca",
    ],
  },
  {
    id: "lato",
    label: "Lato",
    categoryIds: ["lato", "zakonczenie-roku"],
  },
];

export function getProductConfig(productId: ProductId): StoreProduct | undefined {
  for (const category of STORE_CONFIG.categories) {
    const found = category.products.find((p) => p.id === productId);
    if (found) return found;
  }
  return undefined;
}

export function getCategoryConfig(categoryId: CategoryId): StoreCategory | undefined {
  return STORE_CONFIG.categories.find((c) => c.id === categoryId);
}
