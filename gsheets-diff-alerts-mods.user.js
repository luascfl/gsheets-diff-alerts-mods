// ==UserScript==
// @name           Google Sheets Diff alerts mods: Remover cabeçalhos de linhas e Modificar Links do Google (CSE incluído)
// @namespace      http://tampermonkey.net/
// @version        3.6
// @description    Remove elementos .row-header-wrapper, modifica links do Google (incluindo CSE) removendo prefixos de redirecionamento e decodifica %3D para = em todos os elementos de texto dentro de tabelas.
// @author         luascfl (modificado por Gemini)
// @icon           https://e7.pngegg.com/pngimages/660/350/png-clipart-green-and-white-sheet-icon-google-docs-google-sheets-spreadsheet-g-suite-google-angle-rectangle-thumbnail.png
// @match          https://docs.google.com/spreadsheets/d/*/notify/show*
// @match          https://docs.google.com/spreadsheets/u/*/d/*/revisions/show*
// @match          https://cse.google.com/*
// @home           https://github.com/luascfl/gsheets-diff-alerts-mods
// @supportURL     https://github.com/luascfl/gsheets-diff-alerts-mods/issues
// @updateURL      https://raw.githubusercontent.com/luascfl/gsheets-diff-alerts-mods/main/gsheets-diff-alerts-mods.user.js // Mantenha o seu ou atualize se for versionar
// @downloadURL    https://raw.githubusercontent.com/luascfl/gsheets-diff-alerts-mods/main/gsheets-diff-alerts-mods.user.js // Mantenha o seu ou atualize se for versionar
// @license        MIT
// @grant          none
// @run-at         document-start
// ==/UserScript==
(function() {
    'use strict';
    const INTERVALO = 100; // Intervalo em milissegundos

    // Função para remover os row headers
    function removerElementos() {
        document.querySelectorAll('.row-header-wrapper').forEach(el => {
            el.remove();
        });
    }

    // Função para modificar os links do Google
    function modificarLinks() {
        // Primeiro processa todos os links na página
        document.querySelectorAll('a').forEach(link => {
            processarLink(link); // Processa links do Google (geral e CSE)
        });

        // Depois processa especificamente os links dentro de tbody para decodificação
        document.querySelectorAll('tbody a').forEach(link => {
            decodificarEncodingNoLink(link); // Decodifica %3D nos links da tabela
        });

        // Processa todos os elementos textuais dentro de tbody para decodificação
        decodificarTextosEmTbody(); // Decodifica %3D nos textos da tabela
    }

    // Função para processar cada link individualmente - MODIFICADA
    function processarLink(link) {
        // Verifica se é um link de redirecionamento do Google
        if (link.href && link.href.includes('google.com/url?')) {
            try {
                const urlObj = new URL(link.href);
                const params = urlObj.searchParams;

                // Verifica se existe o parâmetro 'q' que contém a URL real
                if (params.has('q')) {
                    const targetUrl = params.get('q'); // Obtém a URL real
                    link.href = targetUrl; // Define o href do link para a URL real

                    // Atualizar também o atributo data-href se existir e corresponder ao padrão
                    if (link.hasAttribute('data-href')) {
                        const dataHref = link.getAttribute('data-href');
                        if (dataHref && dataHref.includes('google.com/url?')) {
                            try {
                                const dataUrlObj = new URL(dataHref);
                                const dataParams = dataUrlObj.searchParams;
                                if (dataParams.has('q')) {
                                    link.setAttribute('data-href', dataParams.get('q'));
                                }
                            } catch (e) {
                                console.warn('Erro ao processar data-href (CSE/Redirect):', dataHref, e);
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn('Erro ao processar URL (CSE/Redirect):', link.href, e);
            }
        }
    }


    // Função específica para decodificar %3D para = nos links dentro de tbody
    function decodificarEncodingNoLink(link) {
        // Decodifica %3D para = no href (tanto no atributo quanto no valor real)
        if (link.href.includes('%3D')) {
            link.href = link.href.replaceAll('%3D', '=');
        }

        // Também verifica e corrige o atributo href diretamente
        if (link.hasAttribute('href')) {
            const hrefAttr = link.getAttribute('href');
            if (hrefAttr.includes('%3D')) {
                link.setAttribute('href', hrefAttr.replaceAll('%3D', '='));
            }
        }

        // Decodifica %3D para = no data-href se existir
        if (link.hasAttribute('data-href')) {
            const dataHref = link.getAttribute('data-href');
            if (dataHref.includes('%3D')) {
                link.setAttribute('data-href', dataHref.replaceAll('%3D', '='));
            }
        }

        // Decodifica %3D para = no texto do link se necessário
        if (link.textContent.includes('%3D')) {
            link.textContent = link.textContent.replaceAll('%3D', '=');
        }

        // Verifica se o texto visível está correto mas o href não
        if (!link.textContent.includes('%3D') && link.textContent.includes('=')) {
            const paramsInText = link.textContent.match(/[?&][^?&=]+=[^?&=]+/g);
            if (paramsInText) {
                let hrefAtual = link.getAttribute('href');
                if (hrefAtual) { // Garante que hrefAtual não é null
                    paramsInText.forEach(param => {
                        const [paramName, paramValue] = param.substring(1).split('=');
                        const encodedParam = `${paramName}%3D${paramValue}`;
                        if (hrefAtual.includes(encodedParam)) {
                            hrefAtual = hrefAtual.replace(encodedParam, `${paramName}=${paramValue}`);
                        }
                    });
                    if (hrefAtual !== link.getAttribute('href')) {
                        link.setAttribute('href', hrefAtual);
                    }
                }
            }
        }
    }

    // Função para decodificar %3D em todos os elementos de texto dentro de tbody
    function decodificarTextosEmTbody() {
        document.querySelectorAll('tbody').forEach(tbody => {
            iterarESusbstituirTextoEmElemento(tbody);
        });
    }

    // Função recursiva para iterar sobre todos os nós filhos e substituir texto
    function iterarESusbstituirTextoEmElemento(elemento) {
        Array.from(elemento.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                if (node.textContent.includes('%3D')) {
                    node.textContent = node.textContent.replaceAll('%3D', '=');
                }
            }
            else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'A') {
                 if (node.value && typeof node.value === 'string' && node.value.includes('%3D')) {
                     node.value = node.value.replaceAll('%3D', '=');
                 }
                 ['title', 'alt', 'placeholder', 'data-text'].forEach(attr => {
                     if (node.hasAttribute(attr)) {
                         const attrValue = node.getAttribute(attr);
                         if (attrValue.includes('%3D')) {
                             node.setAttribute(attr, attrValue.replaceAll('%3D', '='));
                         }
                     }
                 });
                 iterarESusbstituirTextoEmElemento(node);
             }
             // Não precisa processar nós 'A' aqui recursivamente, pois eles já são tratados
             // por processarLink e decodificarEncodingNoLink
        });
    }

    // Função que combina todas as funcionalidades
    function processarPagina() {
        removerElementos();
        modificarLinks();
    }

    // Configuração do observer para detectar mudanças no DOM
    let observer;
    // Usaremos um debounce simples para evitar processamentos excessivos com o observer
    let timeoutId;
    const debouncedProcessarPagina = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(processarPagina, 50); // Atraso de 50ms para debounce
    };

    const callback = (mutationsList, observerInstance) => {
        // Verificamos se alguma mutação relevante ocorreu (adição de nós ou mudanças em atributos)
        // Isso evita reprocessar a página inteira para mudanças triviais
        let relevantChange = false;
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                relevantChange = true;
                break;
            }
            if (mutation.type === 'attributes' && (mutation.attributeName === 'href' || mutation.attributeName === 'data-href')) {
                 relevantChange = true;
                 break;
            }
        }
        if (relevantChange) {
           debouncedProcessarPagina();
        }
    };

    // Executa imediatamente e mantém intervalo (Intervalo pode ser menos necessário com o Observer)
    (function loop() {
        processarPagina(); // Executa uma vez
        // O loop pode ser removido ou ter intervalo maior se o Observer for confiável
        setTimeout(loop, INTERVALO * 5); // Aumentado o intervalo, pois o observer deve pegar a maioria
    })();

    // Garante execução após o carregamento inicial completo
     window.addEventListener('load', () => {
         processarPagina();
         // Inicia o observer após o carregamento inicial e o primeiro processamento
         if (!observer) {
             observer = new MutationObserver(callback); // Usa o callback definido acima
             observer.observe(document.documentElement || document.body, {
                 childList: true,
                 subtree: true,
                 attributes: true, // Observa mudanças de atributos também (importante para href/data-href)
                 attributeFilter: ['href', 'data-href'] // Foca nos atributos relevantes
             });
         }
     });

    // Listener DOMNodeInserted é legado e pode causar problemas de performance.
    // O MutationObserver acima é a forma moderna e mais eficiente.
    // Removendo o listener antigo:
    // document.addEventListener('DOMNodeInserted', function(event) { ... }, false);

})();
