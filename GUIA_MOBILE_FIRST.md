# 📱 Guía Mobile-First Responsive - Agente_Poc_UNITEC

## Estrategia Implementada

Este documento describe la estrategia de diseño **mobile-first responsive** implementada en Agente_Poc_UNITEC.

---

## 🎯 Principios Mobile-First

### 1. **Mobile Primero**
- Diseño base optimizado para pantallas pequeñas (< 640px)
- Breakpoints progresivos para mejorar en pantallas más grandes

### 2. **Progresive Enhancement**
- Funcionalidad básica en móvil
- Mejoras de UX en tablet
- Experiencia completa en desktop

### 3. **Touch-Friendly**
- Botones mínimo 44px x 44px
- Espaciado adecuado entre elementos
- Sin hover obligatorios

---

## 📐 Breakpoints Tailwind

```
Mobile:  0px - 639px   (sm breakpoint en Tailwind)
Tablet:  640px - 1023px  (md breakpoint)
Desktop: 1024px+       (lg breakpoint+)
```

---

## 🔧 Mejoras Implementadas

### 1. Header Responsive
**Archivo:** `SRC/Components/Header.tsx`

```
Mobile:   Altura reducida (py-2), logo más pequeño
Tablet:   Altura normal (py-3), logo mediano
Desktop:  Altura óptima (py-4), logo completo
```

### 2. Contenedor Principal
**Patrón:**
```
- Mobile:  px-3 py-4 (márgenes pequeños)
- Tablet:  px-4 py-6
- Desktop: px-6 py-8 max-w-4xl
```

### 3. Espaciado de Componentes
**Escala mobile-first:**
```
Mobile:   gap-2, space-y-3
Tablet:   gap-3, space-y-4
Desktop:  gap-4, space-y-6
```

### 4. Tipografía Responsive
**Tamaños de fuente:**
```
Mobile:   text-sm para body, text-base para títulos
Tablet:   text-base para body, text-lg para títulos
Desktop:  text-base para body, text-xl para títulos
```

### 5. Grid/Layout
**Número de columnas:**
```
Mobile:   1 columna (w-full)
Tablet:   2 columnas (grid-cols-2)
Desktop:  3+ columnas (grid-cols-3, grid-cols-4)
```

---

## 📊 Matriz de Clases Responsive

### Padding
```
Mobile:   p-3, p-4
Tablet:   md:p-4, md:p-6
Desktop:  lg:p-6, lg:p-8
```

### Margin
```
Mobile:   m-2, m-3
Tablet:   md:m-4
Desktop:  lg:m-6
```

### Width/Height
```
Mobile:   w-full, h-auto
Tablet:   md:w-3/4, md:h-screen
Desktop:  lg:max-w-2xl, lg:h-full
```

### Font Size
```
Mobile:   text-sm, text-base
Tablet:   md:text-base, md:text-lg
Desktop:  lg:text-lg, lg:text-xl
```

### Display/Visibility
```
Mobile:   block, hidden
Tablet:   md:flex, md:grid
Desktop:  lg:flex, lg:grid, lg:contents
```

---

## 🎨 Componentes Optimizados

### Button
```
Mobile:   px-4 py-2 text-sm
Tablet:   md:px-6 md:py-3 md:text-base
Desktop:  lg:px-8 lg:py-4 lg:text-lg
```

### Card/Container
```
Mobile:   rounded-lg shadow-sm border
Tablet:   md:rounded-xl md:shadow-md
Desktop:  lg:rounded-2xl lg:shadow-lg
```

### Input/Textarea
```
Mobile:   text-base (previene zoom en iOS)
Tablet:   md:text-base
Desktop:  lg:text-base (consistente)
```

### Message/Chat
```
Mobile:   max-w-[85%], text-sm
Tablet:   md:max-w-[70%], md:text-base
Desktop:  lg:max-w-[60%], lg:text-base
```

---

## 🔍 Breakpoint Reference

### `sm` (640px)
```html
<div class="text-sm sm:text-base">
  Mobile: text-sm
  Tablet+: text-base
</div>
```

### `md` (768px)
```html
<div class="grid-cols-1 md:grid-cols-2">
  Mobile: 1 column
  Tablet+: 2 columns
</div>
```

### `lg` (1024px)
```html
<div class="px-4 lg:px-8">
  Mobile: px-4 (16px)
  Tablet: px-4
  Desktop: px-8 (32px)
</div>
```

### `xl` (1280px)
```html
<div class="max-w-xl xl:max-w-2xl">
  Mobile: max-w-xl
  Desktop: max-w-2xl
</div>
```

---

## 📱 Patrones Comunes

### Sidebar Navigation (Desktop Only)
```html
<div class="flex flex-col lg:flex-row gap-4">
  <nav class="hidden lg:block w-64">...</nav>
  <main class="flex-1">...</main>
</div>
```

### Hero Section (Responsive Height)
```html
<section class="h-64 sm:h-80 md:h-96 lg:h-screen">
  Content
</section>
```

### Grid Gallery (Responsive Columns)
```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} item={item} />)}
</div>
```

### Responsive Padding Container
```html
<div class="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 lg:px-8 lg:py-6">
  Content
</div>
```

---

## 🎯 Testing Mobile-First

### DevTools Chrome
1. Presionar F12
2. Ir a Device Mode (Ctrl+Shift+M)
3. Seleccionar diferentes dispositivos
4. Verificar breakpoints

### Dispositivos reales a probar
- [ ] iPhone SE (375px)
- [ ] iPhone 12/13 (390px)
- [ ] Samsung S21 (360px)
- [ ] iPad (768px)
- [ ] iPad Pro (1024px)
- [ ] Desktop (1440px+)

---

## ✅ Checklist Mobile-First

- [ ] Toda interfaz funciona sin scroll horizontal en móvil
- [ ] Botones son clickeables (mín 44px)
- [ ] Texto legible sin zoom (mín 16px en inputs)
- [ ] Imágenes responsive (max-w-full)
- [ ] Espaciado adecuado en todos los breakpoints
- [ ] Keine elementos escondidos innecesariamente
- [ ] Touch targets espaciados
- [ ] Performance optimizado (lazy loading, etc)

---

## 📚 Recursos Tailwind Mobile-First

### Documentación
- https://tailwindcss.com/docs/responsive-design
- https://tailwindcss.com/docs/mobile-first

### Cheat Sheet de Breakpoints
```
sm:   @media (min-width: 640px)
md:   @media (min-width: 768px)
lg:   @media (min-width: 1024px)
xl:   @media (min-width: 1280px)
2xl:  @media (min-width: 1536px)
```

---

## 🚀 Implementación Progresiva

### Fase 1: Mobile (✅ Base)
- Diseño optimizado para 360px-480px
- Tipografía clara
- Espaciado suficiente

### Fase 2: Tablet (✅ Mejora)
- Mejor uso del espacio (768px)
- Layouts múltiples
- Componentes expandidos

### Fase 3: Desktop (✅ Completo)
- Experiencia completa (1024px+)
- Layouts complejos
- Interacciones avanzadas

---

## 🎓 Ejemplo Práctico

### Card Responsive
```tsx
<div className="p-3 sm:p-4 md:p-6 bg-card rounded-lg sm:rounded-xl border">
  <h3 className="text-base sm:text-lg md:text-xl font-semibold">
    Título
  </h3>
  <p className="text-sm sm:text-base text-muted-foreground mt-2 sm:mt-3">
    Contenido
  </p>
  <button className="mt-3 sm:mt-4 w-full sm:w-auto px-4 py-2 text-sm sm:text-base">
    Acción
  </button>
</div>
```

### Grid Responsive
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
  {items.map(item => (
    <Card key={item.id} item={item} />
  ))}
</div>
```

---

**Status:** ✅ Guía Completada

**Próximo paso:** Implementar en componentes principales
