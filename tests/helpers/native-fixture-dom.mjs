// A small DOM facade over Java/Jsoup fixture nodes. CSS/layout logic is the actual
// browser compiler; Playwright separately verifies parsing with the browser DOM.
export function fixtureDOMParser(body) {
  class Element {
    constructor(data){this.nodeType=1;this.tagName=data.tag.toUpperCase();this.attributes={...data.attributes};this.childNodes=(data.children??[]).map(node=>node.tag?new Element(node):{nodeType:3,textContent:node.text});this.childNodes.forEach(child=>{child.parentElement=this;});}
    get children(){return this.childNodes.filter(node=>node.nodeType===1);}
    get id(){return this.attributes.id??"";}
    set id(value){this.attributes.id=value;}
    getAttribute(name){return this.attributes[name]??null;}
    hasAttribute(name){return Object.hasOwn(this.attributes,name);}
    append(...nodes){for(const node of nodes){if(node.parentElement)node.parentElement.childNodes=node.parentElement.childNodes.filter(child=>child!==node);node.parentElement=this;this.childNodes.push(node);}}
    matches(selector){const tag=selector.match(/^[A-Za-z_][A-Za-z0-9_-]*/)?.[0];if(tag&&this.tagName!==tag.toUpperCase())return false;for(const match of selector.matchAll(/([.#])([A-Za-z_][A-Za-z0-9_-]*)/g)){if(match[1]==="#"?this.id!==match[2]:!(this.attributes.class??"").split(/\s+/).includes(match[2]))return false;}return true;}
    querySelectorAll(selector){const result=[];for(const child of this.children){if(selector==="dialog[open]"?child.tagName==="DIALOG"&&child.hasAttribute("open"):child.matches(selector))result.push(child);result.push(...child.querySelectorAll(selector));}return result;}
    querySelector(selector){return this.querySelectorAll(selector)[0]??null;}
  }
  return class DOMParser {parseFromString(){return{body:new Element(body),createElement:tag=>new Element({tag,attributes:{},children:[]})};}};
}
