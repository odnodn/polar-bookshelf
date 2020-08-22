import * as React from "react";
import {IDStr} from "polar-shared/src/util/Strings";
import * as ReactDOM from "react-dom";
import {ResizeBox} from "./ResizeBox";
import {IPagemark} from "polar-shared/src/metadata/IPagemark";
import {isPresent} from "polar-shared/src/Preconditions";
import {PagemarkColors} from "polar-shared/src/metadata/PagemarkColors";
import {ILTRect} from "polar-shared/src/util/rects/ILTRect";
import {PagemarkMenu, PagemarkValueContext} from "./PagemarkMenu";
import {
    createContextMenu,
    useContextMenu
} from "../../../repository/js/doc_repo/MUIContextMenu";
import {useDocViewerElementsContext} from "../renderers/DocViewerElementsContext";
import {deepMemo} from "../../../../web/js/react/ReactUtils";
import {EpubCFI} from 'epubjs';
import {PagemarkRect} from "../../../../web/js/metadata/PagemarkRect";
import {Arrays} from "polar-shared/src/util/Arrays";

function computePagemarkFromResize(rect: ILTRect,
                                   browserContext: IBrowserContext,
                                   pagemark: IPagemark) {

    function computeRange(): Range | undefined {

        const doc = browserContext.document;

        const elements = Array.from(doc.querySelectorAll("*")) as HTMLElement[];

        function predicate(element: HTMLElement): boolean {

            if (element.textContent === null || element.textContent.trim() === '') {
                return false;
            }

            return (element.offsetTop + element.offsetHeight) < (rect.top + rect.height);
        }

        const last = Arrays.last(elements.filter(predicate));

        if (! last) {
            return undefined;
        }

        const range = doc.createRange();

        range.setStart(last, 0);
        range.setEnd(last, 0);

        return range;

    }

    const range = computeRange();

    // not needed for EPUB.
    const pagemarkRect = new PagemarkRect({left: 0, top: 0, width: 0, height: 0});

    const newPagemark = Object.assign({}, pagemark);
    newPagemark.percentage = pagemarkRect.toPercentage();
    newPagemark.rect = pagemarkRect;

    return newPagemark;

}

function useEPUBIFrameElement(): HTMLIFrameElement {
    const docViewerElementsContext = useDocViewerElementsContext();
    const docViewerElement = docViewerElementsContext.getDocViewerElement();
    return docViewerElement.querySelector('iframe')!;
}

interface IBrowserContext {
    readonly document: Document;
    readonly window: Window;
}

function useEPUBIFrameBrowserContext(): IBrowserContext{
    const iframe = useEPUBIFrameElement();
    const document = iframe.contentDocument!;
    const window = document.defaultView!;
    return {document, window};
}

interface PagemarkInnerProps {
    readonly id: string;
    readonly className: string;
    readonly fingerprint: string;
    readonly pageNum: number;
    readonly pagemark: IPagemark;
    readonly pagemarkColor: PagemarkColors.PagemarkColor;

}

const PagemarkInner = deepMemo((props: PagemarkInnerProps) => {

    const {id, fingerprint, pagemark, pageNum, className, pagemarkColor} = props;

    const contextMenu = useContextMenu();

    const iframe = useEPUBIFrameElement();
    const browserContext = useEPUBIFrameBrowserContext();

    if (! iframe || ! iframe.contentDocument) {
        // the iframe isn't mounted yet.
        console.log("FIXME: no iframe yet");
        return null;
    }

    function computeHeightFromRange() {

        const cfi = pagemark.range?.end?.value

        if (! cfi) {
            return undefined;
        }

        const epubCFI = new EpubCFI(cfi);
        const range = epubCFI.toRange(browserContext.document);

        if (! range) {
            console.log("No range found for pagemark with CFI: " + cfi);
            return;
        }

        const bcr = range.getBoundingClientRect();
        return bcr.bottom + browserContext.window.scrollY;

    }

    const top = 0;
    const left = 0;
    const width = iframe.contentDocument!.body.offsetWidth;
    const height = computeHeightFromRange() || iframe.contentDocument!.body.offsetHeight;

    const handleResized = React.useCallback((rect: ILTRect) => {

        // FIXME this doesn't work just yet and we need a way to handle it properly
        // because we need to figure out where the pagemarks are being placed
        // based on the epubcfi...

        //
        // const pageElement = docViewerElementsContext.getPageElementForPage(pageNum)!;
        const newPagemark = computePagemarkFromResize(rect, browserContext, pagemark);
        //
        // const mutation: IPagemarkUpdate = {
        //     type: 'update',
        //     pageNum,
        //     pagemark: newPagemark
        // }
        //
        // callbacks.onPagemark(mutation);

    }, []);

    return (
        <ResizeBox
                {...contextMenu}
                {...browserContext}
                onResized={handleResized}
                id={id}
                bounds="parent"
                data-type="pagemark"
                data-doc-fingerprint={fingerprint}
                data-pagemark-id={pagemark.id}
                data-annotation-id={pagemark.id}
                data-page-num={pageNum}
                // annotation descriptor metadata - might not be needed anymore
                data-annotation-type="pagemark"
                data-annotation-page-num={pageNum}
                data-annotation-doc-fingerprint={fingerprint}
                className={className}
                left={left}
                top={top}
                width={width}
                height={height}
                resizeAxis='y'
                resizeHandleStyle={{
                    ...pagemarkColor,
                    mixBlendMode: 'multiply',
                }}
                style={{
                    position: 'absolute',
                    zIndex: 9
                }}/>
    );
});

export const ContextMenu = createContextMenu(PagemarkMenu);

interface IProps {
    readonly fingerprint: IDStr;
    readonly pageNum: number;
    readonly pagemark: IPagemark;
    readonly container: HTMLElement;
}

export const PagemarkRendererForFluid = deepMemo((props: IProps) => {

    const {pagemark, fingerprint, pageNum, container} = props;

    if (! container) {
        return null;
    }

    if (! isPresent(pagemark.percentage)) {
        throw new Error("Pagemark has no percentage");
    }

    const createID = () => {
        return `primary-pagemark-${pagemark.id}`;
    };

    const toReactPortal = (container: HTMLElement) => {

        const id = createID();

        const className = `pagemark annotation polar-ui`;

        const pagemarkColor = PagemarkColors.toPagemarkColor(pagemark);

        return ReactDOM.createPortal(
            <PagemarkValueContext.Provider value={pagemark}>
                <ContextMenu>
                    <PagemarkInner id={id}
                                   className={className}
                                   fingerprint={fingerprint}
                                   pageNum={pageNum}
                                   pagemark={pagemark}
                                   pagemarkColor={pagemarkColor}/>
                </ContextMenu>
            </PagemarkValueContext.Provider>,
            container);
    };

    return toReactPortal(container);

});
