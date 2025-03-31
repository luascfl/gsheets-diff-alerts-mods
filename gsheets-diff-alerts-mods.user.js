// ==UserScript==
// @name         Google Sheets Diff alerts mods: Remover cabeçalhos de linhas e Modificar Links do Google
// @namespace    http://tampermonkey.net/
// @version      3.4
// @description  Remove elementos .row-header-wrapper, modifica links do Google removendo o prefixo de redirecionamento e decodifica %3D para = em todos os elementos de texto dentro de tabelas, garantindo que links como exemplo.com/?parametro%3Dvalor sejam corrigidos
// @author       luascfl
// @icon         https://e7.pngegg.com/pngimages/660/350/png-clipart-green-and-white-sheet-icon-google-docs-google-sheets-spreadsheet-g-suite-google-angle-rectangle-thumbnail.png
// @match        https://docs.google.com/spreadsheets/d/*/notify/show*
// @match        https://docs.google.com/spreadsheets/u/*/d/*/revisions/show*
// @home         https://github.com/luascfl/gsheets-diff-alerts-mods
// @supportURL   https://github.com/luascfl/gsheets-diff-alerts-mods/issues
// @updateURL    https://raw.githubusercontent.com/luascfl/gsheets-diff-alerts-mods/main/gsheets-diff-alerts-mods.user.js
// @downloadURL  https://raw.githubusercontent.com/luascfl/gsheets-diff-alerts-mods/main/gsheets-diff-alerts-mods.user.js
// @license      MIT
// @grant        none
// @run-at       document-start
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
            processarLink(link);
        });

        // Depois processa especificamente os links dentro de tbody
        document.querySelectorAll('tbody a').forEach(link => {
            decodificarEncodingNoLink(link);
        });

        // Processa todos os elementos textuais dentro de tbody
        decodificarTextosEmTbody();
    }

    // Função para processar cada link individualmente
    function processarLink(link) {
        if (link.href.startsWith('https://www.google.com/url?q=')) {
            // Extrai a URL real removendo o prefixo e tudo depois de &sa=
            let novaUrl = link.href.replace('https://www.google.com/url?q=', '');

            // Se tiver o parâmetro &sa=, remove ele e tudo o que vem depois
            const index = novaUrl.indexOf('&sa=');
            if (index !== -1) {
                novaUrl = novaUrl.substring(0, index);
            }

            link.href = novaUrl;

            // Atualizar também o atributo data-href se existir
            if (link.hasAttribute('data-href')) {
                const dataHref = link.getAttribute('data-href');
                if (dataHref.startsWith('https://www.google.com/url?q=')) {
                    let novoDataHref = dataHref.replace('https://www.google.com/url?q=', '');

                    // Se tiver o parâmetro &sa=, remove ele e tudo o que vem depois
                    const dataIndex = novoDataHref.indexOf('&sa=');
                    if (dataIndex !== -1) {
                        novoDataHref = novoDataHref.substring(0, dataIndex);
                    }

                    link.setAttribute('data-href', novoDataHref);
                }
            }
        }
    }

    // Função específica para decodificar %3D para = nos links dentro de tbody
    function decodificarEncodingNoLink(link) {
        // Decodifica %3D para = no href (tanto no atributo quanto no valor real)
        if (link.href.includes('%3D')) {
            // Define o novo href decodificado
            link.href = link.href.replaceAll('%3D', '=');
        }

        // Também verifica e corrige o atributo href diretamente
        // (isso é importante porque às vezes link.href normaliza a URL enquanto o atributo original permanece)
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
        // (como no exemplo: texto é "codigoVaga=5520104" mas href é "codigoVaga%3D5520104")
        if (!link.textContent.includes('%3D') && link.textContent.includes('=')) {
            // Tenta encontrar todos os parâmetros no texto visível
            const paramsInText = link.textContent.match(/[?&][^?&=]+=[^?&=]+/g);
            if (paramsInText) {
                let hrefAtual = link.getAttribute('href');
                // Para cada parâmetro encontrado no texto
                paramsInText.forEach(param => {
                    // Extrai nome e valor do parâmetro
                    const [paramName, paramValue] = param.substring(1).split('=');
                    // Verifica se esse mesmo parâmetro existe no href mas com %3D
                    const encodedParam = `${paramName}%3D${paramValue}`;
                    if (hrefAtual.includes(encodedParam)) {
                        // Substitui a versão codificada pela decodificada
                        hrefAtual = hrefAtual.replace(encodedParam, `${paramName}=${paramValue}`);
                    }
                });
                // Atualiza o href se houve mudanças
                if (hrefAtual !== link.getAttribute('href')) {
                    link.setAttribute('href', hrefAtual);
                }
            }
        }
    }

    // Função para decodificar %3D em todos os elementos de texto dentro de tbody
    function decodificarTextosEmTbody() {
        // Seleciona todos os elementos tbody na página
        document.querySelectorAll('tbody').forEach(tbody => {
            // Itera sobre todos os elementos dentro do tbody
            iterarESusbstituirTextoEmElemento(tbody);
        });
    }

    // Função recursiva para iterar sobre todos os nós filhos e substituir texto
    function iterarESusbstituirTextoEmElemento(elemento) {
        // Para cada nó filho do elemento
        Array.from(elemento.childNodes).forEach(node => {
            // Se for um nó de texto
            if (node.nodeType === Node.TEXT_NODE) {
                if (node.textContent.includes('%3D')) {
                    node.textContent = node.textContent.replaceAll('%3D', '=');
                }
            }
            // Se for um elemento (como div, span, td, etc.) e não for um link (já tratado separadamente)
            else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'A') {
                // Processo para td, th ou outros elementos com valor
                if (node.value && typeof node.value === 'string' && node.value.includes('%3D')) {
                    node.value = node.value.replaceAll('%3D', '=');
                }

                // Processa atributos comuns que podem conter texto
                ['title', 'alt', 'placeholder', 'data-text'].forEach(attr => {
                    if (node.hasAttribute(attr)) {
                        const attrValue = node.getAttribute(attr);
                        if (attrValue.includes('%3D')) {
                            node.setAttribute(attr, attrValue.replaceAll('%3D', '='));
                        }
                    }
                });

                // Continua a recursão para os filhos deste elemento
                iterarESusbstituirTextoEmElemento(node);
            }
        });
    }

    // Função que combina todas as funcionalidades
    function processarPagina() {
        removerElementos();
        modificarLinks();
    }

    // Configuração do observer para detectar mudanças no DOM
    let observer;
    const callback = () => {
        processarPagina();
        if (!observer) {
            observer = new MutationObserver(processarPagina);
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        }
    };

    // Executa imediatamente e mantém intervalo
    (function loop() {
        processarPagina();
        setTimeout(loop, INTERVALO);
    })();

    // Garante execução após o carregamento completo
    window.addEventListener('load', () => {
        processarPagina();
    });

    // Adicionar listener para os links que são adicionados dinamicamente
    document.addEventListener('DOMNodeInserted', function(event) {
        if (event.target.nodeName === 'A' ||
            (event.target.nodeType === 1 && event.target.querySelectorAll)) {
            modificarLinks();
        }
    }, false);
})();
