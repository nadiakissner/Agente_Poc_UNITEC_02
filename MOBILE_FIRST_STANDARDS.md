# 📱 Mobile-First Component Standards - Agente_Poc_UNITEC

## Estándares de Componentes Responsive

Este documento define los estándares para mantener la consistencia mobile-first en todos los componentes.

---

## 🎯 Principios Aplicados

### 1. **Siempre partir de Mobile**
```tsx
// ✅ CORRECTO: Define base para móvil, mejora con breakpoints
<div className="p-3 sm:p-4 md:p-6">
  <h2 className="text-base sm:text-lg md:text-xl">Título</h2>
</div>

// ❌ INCORRECTO: Define para desktop, intenta minimizar
<div className="p-6 sm:p-4 md:p-3">
  <h2 className="text-xl sm:text-lg md:text-base">Título</h2>
</div>
```

### 2. **Touch Targets Mínimos (44x44px)**
```tsx
// ✅ CORRECTO: Botón clickeable en móvil
<button className="px-3 py-2 min-h-11 min-w-11">
  Click
</button>

// ❌ INCORRECTO: Demasiado pequeño en móvil
<button className="px-1 py-1">
  X
</button>
```

### 3. **Sin Scroll Horizontal**
```tsx
// ✅ CORRECTO: Responsive sin overflow
<div className="w-full px-3 sm:px-4">
  <div className="max-w-2xl mx-auto">
    Content
  </div>
</div>

// ❌ INCORRECTO: Puede causar scroll horizontal
<div className="w-screen px-2">
  Content
</div>
```

---

## 📏 Escala de Responsive Values

### Padding/Margin
```
Mobile:   p-2 (8px), p-3 (12px), p-4 (16px)
Tablet:   sm:p-3, sm:p-4, sm:p-6
Desktop:  md:p-4, md:p-6, md:p-8 lg:p-8
```

### Font Size
```
Mobile:   text-xs, text-sm, text-base
Tablet:   sm:text-sm, sm:text-base, sm:text-lg
Desktop:  md:text-base, md:text-lg, md:text-xl
```

### Spacing (gap/space)
```
Mobile:   gap-2, space-y-2, space-x-2
Tablet:   sm:gap-3, sm:space-y-3, sm:space-x-3
Desktop:  md:gap-4, md:space-y-4, lg:gap-6
```

---

## 🧩 Componentes Estándar

### Button
```tsx
// Mobile-first responsive button
<button className="px-3 sm:px-4 md:px-6 py-2 sm:py-2 md:py-3 text-sm sm:text-base min-h-11">
  Acción
</button>
```

### Card
```tsx
// Mobile-first responsive card
<div className="p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl bg-card border">
  <h3 className="text-base sm:text-lg md:text-xl font-semibold">
    Título
  </h3>
  <p className="text-sm sm:text-base text-muted-foreground mt-2 sm:mt-3">
    Contenido
  </p>
</div>
```

### Input/Textarea
```tsx
// Input con tamaño de fuente 16px+ en móvil (previene iOS zoom)
<input 
  type="text"
  className="w-full px-3 py-2 sm:px-4 sm:py-3 text-base border rounded-lg"
  placeholder="Escriba aquí..."
/>
```

### Message/Chat Bubble
```tsx
// Chat bubble responsive
<div className="bg-muted p-3 sm:p-4 rounded-lg sm:rounded-xl max-w-[85%] sm:max-w-[70%] md:max-w-[60%]">
  <p className="text-sm sm:text-base leading-relaxed">
    Mensaje de chat
  </p>
</div>
```

### Grid
```tsx
// Grid responsive
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
  {items.map(item => <Card key={item.id} item={item} />)}
</div>
```

---

## 📝 Patrón Template para Nuevos Componentes

```tsx
export function MyComponent() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Responsive padding y tipografía */}
      <header className="sticky top-0 z-10 bg-background border-b px-3 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold">
            Título
          </h1>
        </div>
      </header>

      {/* Main - Responsive padding y contenedor */}
      <main className="flex-1 w-full px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          {/* Contenido */}
        </div>
      </main>

      {/* Footer - Responsive padding y elementos */}
      <footer className="sticky bottom-0 bg-background border-t px-3 py-3 sm:px-4 sm:py-4">
        <div className="max-w-2xl mx-auto flex gap-2 sm:gap-3">
          <button className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base">
            Acción
          </button>
        </div>
      </footer>
    </div>
  );
}
```

---

## 🎯 Checklist para Code Review

### Mobile (< 640px)
- [ ] Sin scroll horizontal
- [ ] Botones mínimo 44x44px
- [ ] Padding adecuado (px-3, py-2)
- [ ] Tipografía legible (text-sm mínimo)
- [ ] Input font-size: 16px (previene zoom)
- [ ] Espaciado entre elementos (gap-2, space-y-2)
- [ ] Interactivos accesibles sin hover

### Tablet (640px - 1024px)
- [ ] Mejor uso del espacio
- [ ] Layouts expandidos (2 columnas)
- [ ] Padding aumentado (sm:p-4)
- [ ] Tipografía mejorada (sm:text-base)
- [ ] Elementos más espaciados (sm:gap-3)

### Desktop (1024px+)
- [ ] Experiencia completa optimizada
- [ ] Layouts complejos (3+ columnas)
- [ ] Padding óptimo (md:p-6, lg:p-8)
- [ ] Tipografía expandida (md:text-lg)
- [ ] Máximo ancho contenedor (max-w-4xl)
- [ ] Hover states funcionando correctamente

---

## 🚀 Utilidades CSS Disponibles

### Responsive Classes (definidas en index.css)

```tsx
// Contenedores predefinidos
<div className="container-sm">...</div>  {/* max-w-sm */}
<div className="container-md">...</div>  {/* max-w-2xl */}
<div className="container-lg">...</div>  {/* max-w-4xl */}

// Padding responsive
<div className="px-responsive py-responsive">...</div>

// Gap responsive
<div className="gap-responsive">...</div>
<div className="space-y-responsive">...</div>

// Typography responsive
<h2 className="text-responsive-lg">Título</h2>
<p className="text-responsive-base">Párrafo</p>
```

---

## 📱 Testing en Diferentes Dispositivos

### Chrome DevTools
1. F12 → Device Mode (Ctrl+Shift+M)
2. Seleccionar dispositivo
3. Verificar:
   - [ ] Sin scroll horizontal
   - [ ] Elementos clickeables
   - [ ] Texto legible
   - [ ] Imágenes responsive

### Dispositivos a probar
- [x] iPhone SE (375px)
- [x] iPhone 12/13/14 (390px-428px)
- [x] Samsung S21 (360px)
- [x] iPad (768px)
- [x] iPad Pro (1024px)
- [x] Desktop 1440px

---

## ⚡ Performance Tips Mobile

### 1. Imágenes
```tsx
// Responsive images
<img 
  src="image-sm.jpg"
  srcSet="image-md.jpg 640w, image-lg.jpg 1024w"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
  alt="Descripción"
  className="w-full h-auto"
/>
```

### 2. Lazy Loading
```tsx
// Para componentes pesados
<div className="hidden sm:block">
  {/* Mostrar solo en tablet+ */}
</div>
```

### 3. Prevenir Layout Shift
```tsx
// Usar aspect-ratio
<div className="aspect-video bg-muted rounded-lg">
  <img src="image.jpg" alt="Descripción" className="w-full h-full" />
</div>
```

---

## 🔄 Patrón de Actualización de Componentes

Cuando actualices un componente a mobile-first:

1. **Revisar tamaños base (móvil)**
   - Padding: p-3 o p-4
   - Font: text-sm o text-base
   - Gap: gap-2 o gap-3

2. **Agregar breakpoints**
   - sm: para tablets (640px+)
   - md: para desktop pequeño (768px+)
   - lg: para desktop (1024px+)

3. **Testear en todos los tamaños**
   - Verificar que se ve bien
   - Sin scroll horizontal
   - Elementos clickeables

4. **Documentar si es necesario**
   - Si hay lógica especial responsive
   - Si hay decisiones de diseño particulares

---

## 📚 Referencias

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Mobile-First Approach](https://www.nngroup.com/articles/mobile-first-web-design/)
- [Touch Target Sizing](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [iOS Input Zooming](https://css-tricks.com/16px-or-larger-font-size-on-mobile-devices-is-important/)

---

**Status:** ✅ Standards Definidos

**Próximo paso:** Aplicar a todos los componentes
