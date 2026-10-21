#!/usr/bin/env python3
"""
Gera as versões de teste de H1 (v2.html, v3.html…) a partir do index.html (= V1).
Tudo é igual ao index.html, só muda o H1, o subtítulo (H2) e, se houver, a linha "inclui" (H3).

Uso (na raiz do repositório):  python3 versoes/gerar.py
Sempre que mudar o index.html, rode de novo para as versões herdarem a mudança.

Marcação nos textos:
  |      quebra de linha (o H1 não quebra sozinho; cada linha deve caber no celular, ~25 caracteres;
         com longo=True, ~30)
  *...*  destaque (H1: dourado · H2: dourado, como o "acesso pra sempre" da V1)
"""
import html, pathlib, re, sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent

VERSOES = {
    'v2': dict(
        h1='Pare de esperar|anos pelo êxito.|Aprenda a cobrar|honorário inicial na|assinatura do contrato.',
        h2='Na Black Friday Infinita, eu vou liberar todas as minhas formações de Direito Bancário '
           'e todas as que eu ainda vou lançar, numa única compra e com *acesso pra sempre*.',
        h3='Advocacia Bancária Milionária, TABM, Rota 10k e mais 12 treinamentos',
    ),
    'v3': dict(
        h1='R$ 250 mil em um único|contrato, fechado fora|do fórum. Aprenda como,|com acesso pra sempre|a tudo o que eu ensino.',
        h2='Na Black Friday Infinita, eu vou te entregar a trilha completa do Direito Bancário '
           'numa única compra, com acesso pra sempre. E tudo o que eu lançar depois entra no seu '
           'acesso, sem pagar de novo.',
    ),
    'v4': dict(
        longo=True,
        h1='Todas as minhas formações|atuais. Todas as que eu|ainda vou lançar. Com|acesso pra sempre e|*um desconto histórico*',
        h2='A trilha completa pra sair do êxito e construir um escritório bancário com honorário '
           'inicial e previsibilidade.',
    ),
    'v5': dict(
        longo=True,
        h1='Na Black Friday Infinita,|eu vou liberar todas as minhas|formações de Direito Bancário|e todas as que eu ainda vou|lançar, numa única compra|e com acesso pra sempre.',
        h2='A trilha completa pra sair do êxito e construir um escritório bancário com honorário '
           'inicial e previsibilidade.',
    ),
}

CHECK = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" '
         'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>')


def fmt(txt, em_cls=''):
    t = html.escape(txt, quote=False)
    cls = f' class="{em_cls}"' if em_cls else ''
    t = re.sub(r'\*(.+?)\*', lambda m: f'<em{cls}>{m.group(1)}</em>', t)
    return t.replace('|', '<br class="br-d"> ')


def main():
    base = (RAIZ / 'index.html').read_text(encoding='utf-8')
    for nome, v in VERSOES.items():
        h = base
        cls = 'hero-in h1-long' if v.get('longo') else 'hero-in'
        h, n1 = re.subn(r'<h1 id="hero-title" class="hero-in"( style="[^"]*")>.*?</h1>',
                        lambda m: f'<h1 id="hero-title" class="{cls}"{m.group(1)}>{fmt(v["h1"], "hl")}</h1>',
                        h, count=1, flags=re.S)
        extra = ''
        if v.get('h3'):
            extra = f'\n      <p class="hero-incl hero-in" style="--d:.44s">{CHECK}<span>{fmt(v["h3"])}</span></p>'
        h, n2 = re.subn(r'(<p class="hero-pre hero-in"[^>]*>).*?(</p>)',
                        lambda m: m.group(1) + fmt(v['h2']) + m.group(2) + extra, h, count=1, flags=re.S)
        if n1 != 1 or n2 != 1:
            sys.exit(f'{nome}: não achei o H1/H2 no index.html')
        h = h.replace('<html lang="pt-BR">', f'<html lang="pt-BR" data-versao="{nome}">', 1)
        (RAIZ / f'{nome}.html').write_text(h, encoding='utf-8')
        print('gerado', f'{nome}.html')


if __name__ == '__main__':
    main()
