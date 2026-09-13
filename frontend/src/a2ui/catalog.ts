// Catálogo real de React para el surface generativo — combina los 6
// componentes reusados de @a2ui/react/v0_9 (Text, Button, Column, Row, Card,
// Slider, con su render real) con los 9 de dominio de @hackbanorte/catalog.
// Estos últimos se van reemplazando uno por uno (ver DOMAIN_RENDERERS abajo):
// el que no tiene entrada ahí sigue cayendo a DomainPlaceholder.
//
// No existe `extendCatalog`/`mergeCatalogs` en @a2ui/web_core — el patrón
// soportado (ver Catalog.components/.functions, ReadonlyMap "para fomentar
// extensión inmutable") es construir una instancia nueva a partir de los
// arrays de la base. Mismo patrón ya verificado en el smoke test de PASO 6.
import { Catalog } from "@a2ui/web_core/v0_9";
import { basicCatalog, createComponentImplementation } from "@a2ui/react/v0_9";
import { manifest, CATALOG_ID } from "@hackbanorte/catalog";
import { makeDomainPlaceholder } from "./DomainPlaceholder";
import { ContributionBalance } from "./domain/ContributionBalance";

const BASIC_NAMES = new Set(["Text", "Button", "Column", "Row", "Card", "Slider"]);

// Renderers de dominio ya implementados. Los que faltan (el resto de los 9)
// siguen cayendo a DomainPlaceholder más abajo — se van agregando aquí uno
// por uno, sin tocar el resto de este archivo.
const DOMAIN_RENDERERS: Record<string, any> = {
  ContributionBalance,
};

const domainImpls = manifest
  .filter((entry) => !BASIC_NAMES.has(entry.name))
  .map((entry) => createComponentImplementation(entry as any, DOMAIN_RENDERERS[entry.name] ?? makeDomainPlaceholder(entry.name)));

// El id del catálogo DEBE coincidir exactamente con el catalogId que manda
// el backend en createSurface (services/llm.ts, mismo CATALOG_ID importado
// de @hackbanorte/catalog) — si no coinciden, MessageProcessor no encuentra
// el catálogo y ninguna surface se crea ("Catalog not found"), como ya pasó
// en el smoke test de PASO 6.
export const reactCatalog = new Catalog(
  CATALOG_ID,
  [...basicCatalog.components.values(), ...domainImpls],
  [...basicCatalog.functions.values()],
  basicCatalog.themeSchema
);
