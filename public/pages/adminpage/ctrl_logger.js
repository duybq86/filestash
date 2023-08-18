import { createElement, createRender } from "../../lib/skeleton/index.js";
import rxjs, { effect, stateMutation, applyMutation } from "../../lib/rx.js";
import { qs } from "../../lib/dom.js";
import { createForm } from "../../lib/form.js";
import { formTmpl } from "../../components/form.js";
import { generateSkeleton } from "../../components/skeleton.js";

import transition from "./animate.js";
import { renderLeaf } from "./helper_form.js";
import AdminHOC from "./decorator.js";
import Log from "./model_log.js";
import Audit from "./model_audit.js";
import { get as getConfig } from "./model_config.js";

function Page(render) {
    const $page = createElement(`
        <div class="component_logpage sticky">
            <h2>Logging</h2>
            <div class="component_logviewer"></div>
            <div class="component_logger"></div>

            <h2>Activity Report</h2>
            <div class="component_reporter"></div>
        <div>
    `);
    render(transition($page));

    componentLogForm(createRender($page.querySelector(".component_logger")));
    componentLogViewer(createRender($page.querySelector(".component_logviewer")));
    componentAuditor(createRender($page.querySelector(".component_reporter")));
}

export default AdminHOC(Page);

function componentLogForm(render) {
    const $form = createElement(`
        <form style="min-height: 240px; margin-top:20px;">
            ${generateSkeleton(4)}
        </form>
    `);

    render($form);

    // feature1: render the form
    effect(getConfig().pipe(
        rxjs.map(({ log }) => ({ params: log })),
        rxjs.map((formSpec) => createForm(formSpec, formTmpl({ renderLeaf }))),
        rxjs.mergeMap((promise) => rxjs.from(promise)),
        rxjs.map(($form) => [$form]),
        applyMutation($form, "replaceChildren")
    ));

    // TODO feature2: response to form change
}

function componentLogViewer(render) {
    const $page = createElement(`<pre style="height:350px; max-height: 350px">…</pre>`);
    render($page);

    effect(Log.get().pipe(
        stateMutation($page, "textContent")
    ));
}

function componentAuditor(render) {
    const $page = createElement(`
        <div>
            <form></form>
            <div data-bind="auditor"></div>
        </div>
    `);
    render($page);

    // setup the form
    effect(Audit.get().pipe(
        rxjs.map(({ form }) => form),
        rxjs.map((formSpec) => createForm(formSpec, formTmpl())),
        rxjs.mergeMap((promise) => rxjs.from(promise)),
        rxjs.map(($form) => [$form]),
        applyMutation(qs($page, "form"), "appendChild")
    ));

    // setup the result
    effect(Audit.get().pipe(
        rxjs.map(({ render }) => render),
        stateMutation(qs($page, "[data-bind=\"auditor\"]"), "innerHTML")
    ));
}