import{a8 as r,r as l,J as e,I as d,cl as p,cm as x,ai as u,cn as h,co as m,cp as c,cq as j,cr as w,cs as g}from"./index-DPGZIZMG.js";/**
 * @license lucide-react v0.359.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=r("Ellipsis",[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"19",cy:"12",r:"1",key:"1wjl8i"}],["circle",{cx:"5",cy:"12",r:"1",key:"1pcz8c"}]]);/**
 * @license lucide-react v0.359.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=r("Pencil",[["path",{d:"M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z",key:"5qss01"}],["path",{d:"m15 5 4 4",key:"1mk7zo"}]]);function N({children:s,actions:a,row:o}){const t=l.useCallback(n=>{(n.key==="Enter"||n.key===" ")&&(n.preventDefault(),n.stopPropagation(),a.onOpen(o.original))},[a,o.original]);return e.jsx("div",{className:"flex flex-row gap-2 items-center",onClick:n=>n.stopPropagation(),onKeyDown:t,tabIndex:0,role:"button",children:s})}function f({row:s,onDelete:a,onEdit:o,onOpen:t}){const{t:n}=d();return e.jsxs(p,{children:[e.jsx(x,{asChild:!0,children:e.jsxs(u,{variant:"ghost","data-testid":"action-menu-open",className:"p-0 w-8 h-8",children:[e.jsx("span",{className:"sr-only",children:"Open menu"}),e.jsx(k,{className:"w-4 h-4"})]})}),e.jsxs(h,{align:"end",children:[e.jsx(m,{children:n("actions")}),e.jsxs(c,{"data-testid":"action-row-open",onClick:()=>{t(s.original)},children:[e.jsx(j,{className:"mr-1 w-4 h-4"})," ",n("open")]}),e.jsx(w,{}),e.jsxs(c,{"data-testid":"action-row-edit",onClick:i=>{i.stopPropagation(),o(s.original)},children:[e.jsx(y,{className:"mr-1 w-4 h-4"}),"    ",n("edit")]}),e.jsxs(c,{"data-testid":"action-row-delete",onClick:i=>{i.stopPropagation(),a(s.original)},className:"text-destructive",children:[e.jsx(g,{className:"mr-1 w-4 h-4"}),n("delete")]})]})]})}export{f as D,N};
