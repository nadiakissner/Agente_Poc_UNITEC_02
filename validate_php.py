#!/usr/bin/env python3
"""
Script para validar sintaxis básica de PHP sin ejecutar PHP
Busca errores comunes de sintaxis en archivos PHP
"""

import re
import sys
from pathlib import Path

def check_php_syntax(file_path):
    """Verifica sintaxis básica de PHP"""
    
    print(f"📋 Validando: {file_path}\n")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        lines = content.split('\n')
    
    errors = []
    warnings = []
    
    # 1. Verificar apertura PHP
    if not content.startswith('<?php'):
        errors.append("❌ El archivo debe comenzar con '<?php'")
    
    # 2. Verificar cierre PHP (opcional pero recomendado)
    if not content.rstrip().endswith('?>'):
        warnings.append("⚠️  El archivo no termina con '?>' (opcional)")
    
    # 3. Verificar paréntesis desbalanceados
    open_parens = content.count('(') - content.count(')')
    open_braces = content.count('{') - content.count('}')
    open_brackets = content.count('[') - content.count(']')
    
    if open_parens != 0:
        errors.append(f"❌ Paréntesis desbalanceados: {open_parens:+d}")
    if open_braces != 0:
        errors.append(f"❌ Llaves desbalanceadas: {open_braces:+d}")
    if open_brackets != 0:
        errors.append(f"❌ Corchetes desbalanceados: {open_brackets:+d}")
    
    # 4. Verificar comillas desbalanceadas (aproximado)
    # Contar comillas simples y dobles, excluyendo las escapadas
    simple_quotes = len(re.findall(r"(?<!\\)'", content))
    double_quotes = len(re.findall(r'(?<!\\)"', content))
    
    if simple_quotes % 2 != 0:
        warnings.append(f"⚠️  Posibles comillas simples desbalanceadas ({simple_quotes})")
    if double_quotes % 2 != 0:
        warnings.append(f"⚠️  Posibles comillas dobles desbalanceadas ({double_quotes})")
    
    # 5. Verificar sintaxis de function
    function_pattern = r'function\s+\w+\s*\('
    functions = re.findall(function_pattern, content)
    print(f"✓ {len(functions)} funciones encontradas\n")
    
    # 6. Verificar add_action
    add_action_pattern = r"add_action\s*\("
    add_actions = len(re.findall(add_action_pattern, content))
    print(f"✓ {add_actions} add_action() encontradas\n")
    
    # 7. Verificar register_rest_route
    rest_routes = len(re.findall(r"register_rest_route\s*\(", content))
    print(f"✓ {rest_routes} register_rest_route() encontradas\n")
    
    # 8. Verificar constantes definidas
    constants = re.findall(r"define\s*\(\s*['\"]([A-Z_]+)", content)
    print(f"✓ {len(constants)} constantes definidas:")
    for const in constants[:10]:
        print(f"  • {const}")
    if len(constants) > 10:
        print(f"  ... y {len(constants) - 10} más\n")
    else:
        print()
    
    # 9. Buscar patrones peligrosos
    if 'eval(' in content:
        warnings.append("⚠️  ¡PELIGROSO! Contiene eval()")
    
    if 'system(' in content or 'exec(' in content:
        warnings.append("⚠️  Contiene system() o exec()")
    
    # 10. Verificar que ABSPATH está definido
    if 'if ( ! defined( \'ABSPATH\' ) )' in content:
        print("✓ Protección contra acceso directo: ENCONTRADA\n")
    else:
        errors.append("❌ Falta la protección: 'if ( ! defined( ABSPATH ) )'")
    
    # 11. Verificar función de sanitización
    if 'sanitize_text_field' in content:
        print("✓ Sanitización: ENCONTRADA\n")
    else:
        warnings.append("⚠️  No se usa sanitize_text_field()")
    
    # Estadísticas
    print("\n" + "="*50)
    print("📊 ESTADÍSTICAS")
    print("="*50)
    print(f"Líneas de código: {len(lines)}")
    print(f"Caracteres: {len(content)}")
    print(f"Tamaño: {len(content) / 1024:.2f} KB\n")
    
    # Resultados
    if errors:
        print("🔴 ERRORES ENCONTRADOS:")
        for error in errors:
            print(f"  {error}")
        print()
    
    if warnings:
        print("🟡 ADVERTENCIAS:")
        for warning in warnings:
            print(f"  {warning}")
        print()
    
    if not errors and not warnings:
        print("✅ SINTAXIS VÁLIDA - No se encontraron errores críticos\n")
    
    # Verificar nombre del plugin
    if 'Plugin Name:' in content:
        match = re.search(r'Plugin Name:\s*(.+)', content)
        if match:
            print(f"Plugin Name: {match.group(1)}")
    
    if 'Version:' in content:
        match = re.search(r'Version:\s*(.+)', content)
        if match:
            print(f"Version: {match.group(1)}")
    
    return len(errors) == 0

if __name__ == '__main__':
    file_path = Path('agente-retencion-unitec-02.php')
    
    if not file_path.exists():
        print(f"❌ Archivo no encontrado: {file_path}")
        sys.exit(1)
    
    success = check_php_syntax(file_path)
    sys.exit(0 if success else 1)
