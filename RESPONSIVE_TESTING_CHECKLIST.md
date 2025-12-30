# 📱 Mobile-First Responsive Testing Checklist

## Quick Test Guide

Use este checklist para validar que todos los componentes se ven correctamente en diferentes dispositivos.

---

## 🔍 Testing Procedures

### Chrome DevTools Testing
1. Abre DevTools (F12)
2. Activa Device Mode (Ctrl+Shift+M)
3. Prueba en los siguientes tamaños

### Actual Device Testing
Use dispositivos reales cuando sea posible:
- iPhone: 375px-428px
- Samsung: 360px-412px
- iPad: 768px+
- Desktop: 1440px

---

## ✅ Mobile Tests (360px - 480px)

### Home Page
- [ ] Logo visible y legible
- [ ] Heading "¿Cómo estás hoy?" centrado
- [ ] Botones ocupan ancho total con padding
- [ ] Spacing entre elementos visible
- [ ] Sin scroll horizontal
- [ ] Botones clickeables (44px+ altura)

### Questionnaire
- [ ] Preguntas legibles
- [ ] Radio buttons/checkboxes accesibles
- [ ] Botones "Siguiente" / "Anterior" 44px+
- [ ] Progress bar completo ancho
- [ ] Sin scroll horizontal en opciones
- [ ] Input text no zoom en iOS (16px)

### Agent (Chat)
- [ ] Header con subtitle visible
- [ ] Chat bubbles se adaptan (max-width 85%)
- [ ] Input box sticky en bottom
- [ ] Botón "Enviar" alineado correctamente
- [ ] Scroll vertical en mensajes
- [ ] Status user info compacto

### Summary
- [ ] Checkmark icon visible
- [ ] Card "Tema principal" responsive
- [ ] Botón principal 44px+ alto
- [ ] "Ver otros temas" botón centrado
- [ ] Sin scroll horizontal

### Route Pages (A-G)
- [ ] Chat bubbles legibles
- [ ] Chips se adaptan ancho
- [ ] Icons en chips apropiados
- [ ] Resource cards legibles
- [ ] Botones "Ver otros" centrados
- [ ] Sin overflow en texto

---

## ✅ Tablet Tests (640px - 1024px)

### Breakpoint SM (640px)
- [ ] Padding aumentó (px-3 → px-4)
- [ ] Tipografía mejorada (text-sm → text-base)
- [ ] Spacing aumentó (gap-2 → gap-3)
- [ ] Layout sin cambios abruptos
- [ ] Logo mantiene escala correcta

### Breakpoint MD (768px)
- [ ] Contenedor al max-width completo
- [ ] Padding óptimo (px-4 → px-6)
- [ ] Tipografía escalada completamente
- [ ] Chat bubbles en 70% ancho
- [ ] Cards con spacing mejorado
- [ ] Elementos bien distribuidos

### Breakpoint LG (1024px)
- [ ] Máximo ancho respetado (max-w-2xl)
- [ ] Padding final aplicado (md:px-6)
- [ ] Tipografía final (md:text-lg)
- [ ] Chat bubbles en 60% ancho
- [ ] Todo se ve profesional

---

## ✅ Desktop Tests (1440px+)

### Layout
- [ ] Contenedor centrado (max-w-2xl)
- [ ] Padding lateral igual en ambos lados
- [ ] Máximo ancho respetado
- [ ] No se expande más allá de necesario

### Typography
- [ ] Encabezados legibles
- [ ] Párrafos con buen line-height
- [ ] Código/monospace alineado
- [ ] Links con color apropiado

### Interactivity
- [ ] Hover states visibles
- [ ] Click areas obvias
- [ ] Cursor cambia en botones
- [ ] Focus ring visible en inputs

### Components
- [ ] Spacing consistente
- [ ] Elementos no se superponen
- [ ] Cards tienen sombra
- [ ] Animaciones fluidas

---

## 🎯 Specific Component Tests

### Header (All Sizes)
```
Mobile (360px):
- Logo escala 75%
- Padding: py-2 px-3
- Subtitle: text-xs

Tablet (640px):
- Logo escala 100%
- Padding: py-3 px-4
- Subtitle: text-sm

Desktop (1024px):
- Logo escala 100%
- Padding: py-4 px-6
- Subtitle: text-base
```

Test:
- [ ] Logo está centrado verticalmente
- [ ] Subtitle debajo del logo
- [ ] Border-bottom visible
- [ ] Sticky position funciona

### Buttons (All Sizes)
```
Mobile:
- Height: 40px (py-2)
- Padding: px-3
- Font: text-xs
- Min touch: 40x40px

Tablet:
- Height: 44px (py-2.5)
- Padding: px-4
- Font: text-sm
- Min touch: 44x44px

Desktop:
- Height: 48px (py-3)
- Padding: px-6
- Font: text-base
- Min touch: 48x48px
```

Test:
- [ ] Altura mínima 44px cumplida
- [ ] Padding horizontal consistente
- [ ] Texto legible
- [ ] Hover state visible (desktop)
- [ ] Focus ring visible (keyboard nav)

### Input Fields
```
Mobile:
- Font-size: text-sm (14px base, pero input 16px)
- Padding: px-3 py-2
- Height: min-h-10

Tablet:
- Font-size: text-base (16px)
- Padding: px-3 py-2.5
- Height: min-h-11

Desktop:
- Font-size: text-base (16px)
- Padding: px-4 py-3
- Height: min-h-11
```

Test:
- [ ] Input font-size 16px (previene zoom iOS)
- [ ] Focus ring visible
- [ ] Placeholder texto visible
- [ ] Cursor correcto
- [ ] Padding interno visible

### Chips/Buttons de Opción
```
Mobile:
- Width: w-full
- Padding: py-2 px-3
- Font: text-xs
- Gap entre chips: gap-2

Tablet:
- Width: w-full
- Padding: py-2.5 px-4
- Font: text-sm
- Gap entre chips: gap-2.5

Desktop:
- Width: w-full
- Padding: py-3 px-4
- Font: text-base
- Gap entre chips: gap-3
```

Test:
- [ ] Ocupan ancho total
- [ ] Texto no se corta
- [ ] Gap consistente
- [ ] Hover estado visible
- [ ] Ripple/click animation funciona

### Chat Bubbles
```
Mobile:
- Max-width: 85%
- Padding: p-3
- Font: text-sm
- Margin: space-y-2

Tablet:
- Max-width: 70%
- Padding: p-3
- Font: text-sm
- Margin: space-y-3

Desktop:
- Max-width: 60%
- Padding: p-4
- Font: text-base
- Margin: space-y-4
```

Test:
- [ ] Bubble se adapta al contenido
- [ ] No ocupan pantalla completa
- [ ] Texto legible
- [ ] Alineación izquierda/derecha correcta
- [ ] Margin inferior consistente

---

## 🐛 Common Issues Checklist

### Horizontal Scroll Issues
- [ ] Max-width contenedor set
- [ ] Padding incluido en width
- [ ] No width: 100% + padding
- [ ] Overflow-x: hidden no necesario

### Typography Issues
- [ ] Input font-size 16px minimum
- [ ] Base font-size consistent
- [ ] Heading scale logical
- [ ] Line-height adequate

### Touch Target Issues
- [ ] Min-height 44px aplicado
- [ ] Min-width 44px implícito (flex/block)
- [ ] Padding no reduce target
- [ ] Gap entre targets 8px+

### Spacing Issues
- [ ] Space-y consistent
- [ ] Gap consistent
- [ ] Padding progression lógica
- [ ] No spacing inversus (p-8 sm:p-4)

### Color/Contrast Issues
- [ ] Text contrast 4.5:1 mínimo
- [ ] Focus ring visible
- [ ] Link color distinct
- [ ] Error messages clear

---

## 📊 Automated Testing Checklist

### Lighthouse Test (Chrome DevTools)
1. Abre DevTools → Lighthouse
2. Selecciona "Mobile" device
3. Run audit
4. Verifica:

- [ ] Accessibility score ≥ 90
- [ ] Performance score ≥ 80
- [ ] Best Practices score ≥ 90
- [ ] SEO score ≥ 90

### axe DevTools Test
1. Instala extensión axe DevTools
2. Corre accessibility test
3. Fix issues reportados:

- [ ] No contrast issues
- [ ] No ARIA issues
- [ ] No form labeling issues
- [ ] No structural issues

### Responsive Design Test
Use: https://responsivedesignchecker.com
- [ ] 360px: sin scroll horizontal
- [ ] 640px: layout improvements visible
- [ ] 768px: mejor spacing
- [ ] 1024px: desktop layout correcto
- [ ] 1440px: max-width respetado

---

## 🎬 User Testing Scenarios

### Scenario 1: Student on iPhone SE (375px)
1. Abre la aplicación
2. [ ] No horizontal scroll
3. [ ] Puede leer contenido sin zoom
4. [ ] Puede tocar botones sin error
5. [ ] Navegación intuitiva

### Scenario 2: Student on iPad (768px)
1. Abre la aplicación en landscape
2. [ ] Layout aprovecha espacio
3. [ ] Contenido centrado
4. [ ] Botones fáciles de tocar
5. [ ] Tipografía legible

### Scenario 3: Admin on Desktop (1440px)
1. Abre la aplicación en browser
2. [ ] Contenido centrado
3. [ ] Max-width respetado
4. [ ] No se ve "stretch"
5. [ ] Profesional appearance

---

## 📝 Testing Report Template

```
Date: ___________
Tester: ___________

Device: ___________ Screen Size: ___________

## Pass/Fail Results

Mobile (360px):
- Home: ☐ Pass ☐ Fail
- Questionnaire: ☐ Pass ☐ Fail
- Agent: ☐ Pass ☐ Fail
- Summary: ☐ Pass ☐ Fail
- RouteX: ☐ Pass ☐ Fail

Tablet (768px):
- All pages: ☐ Pass ☐ Fail

Desktop (1440px):
- All pages: ☐ Pass ☐ Fail

## Issues Found

1. ___________________________
2. ___________________________
3. ___________________________

## Notes

___________________________
___________________________
```

---

## 🚀 Release Checklist

Before deploying to production:

- [ ] All pages tested on min-width (360px)
- [ ] All pages tested on max-width (1440px)
- [ ] All breakpoints tested (base, sm, md, lg)
- [ ] No horizontal scroll any device
- [ ] All buttons 44px+ minimum
- [ ] All text legible without zoom
- [ ] Lighthouse scores ≥ 80
- [ ] axe accessibility test passed
- [ ] Actual device testing done
- [ ] Performance acceptable (<3s load)
- [ ] No console errors
- [ ] Documentation updated

---

## 📞 Support

Si encuentra problemas:

1. Verificar con DevTools que clase está aplicada
2. Revisar Tailwind docs para el utility
3. Consultar MOBILE_FIRST_STANDARDS.md
4. Verificar que breakpoint es correcto (mobile-first!)

---

**Last Updated:** 2024  
**Version:** 1.0  
**Status:** Ready for testing
