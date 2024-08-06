import InputField from "./InputField";
import "./style.css";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { ToggleSwitch } from "xellanix-react";

type Step = {
    name: string;
    page: JSX.Element;
};

type MetadataParam = {
    label: string;
    default: string;
};

type MetadataParamList = { [key: string]: MetadataParam };

type Metadata = {
    title: string;
    subtitle: string;
    width: number;
    height: number;
    lastLayerIndex: number;
    caption: {
        template: string;
        params: MetadataParamList;
    };
};

const MetadataContext = createContext<Metadata | null>(null);
function useMetadata() {
    const metadata = useContext(MetadataContext);

    if (!metadata) {
        throw new Error("useMetadata must be used within a MetadataProvider");
    }

    return metadata;
}

function ImportForm() {
    const metadata = useMetadata();

    const importJson = useCallback(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json";
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const data = JSON.parse(e.target?.result as string);
                    metadata.title = data.title;
                    metadata.subtitle = data.subtitle;
                    metadata.width = data.width;
                    metadata.height = data.height;
                    metadata.lastLayerIndex = data.lastLayerIndex;
                    metadata.caption = data.caption;
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }, [metadata]);

    return (
        <button type="button" className="button accent" onClick={importJson}>
            Import metadata.json file
        </button>
    );
}

function TitleForm({ inputChange }: { inputChange: (e: any) => void }) {
    const metadata = useMetadata();

    return (
        <>
            <InputField
                label="Title"
                name="title"
                value={metadata.title}
                type="text"
                onChange={inputChange}
            />
            <InputField
                label="Subtitle"
                name="subtitle"
                type="text"
                value={metadata.subtitle}
                onChange={inputChange}
            />
        </>
    );
}

function SizeForm({ inputChange }: { inputChange: (e: any) => void }) {
    const metadata = useMetadata();

    return (
        <>
            <InputField
                label="Width"
                name="width"
                value={metadata.width}
                type="number"
                onChange={inputChange}
            />
            <InputField
                label="Height"
                name="height"
                type="number"
                value={metadata.height}
                onChange={inputChange}
            />
        </>
    );
}

function LayerForm({ inputChange }: { inputChange: (e: any) => void }) {
    const metadata = useMetadata();

    return (
        <>
            <InputField
                label="Last Layer Index"
                name="lastLayerIndex"
                value={metadata.lastLayerIndex}
                type="number"
                onChange={inputChange}
            />
        </>
    );
}

function CaptionForm({ inputChange }: { inputChange: (e: any) => void }) {
    const metadata = useMetadata();

    return (
        <>
            <textarea
                name="title"
                style={{
                    padding: "16px",
                    border: "2px solid var(--separator-color2)",
                    borderRadius: "var(--button-border-radius)",
                    height: "100%",
                }}
                value={metadata.caption.template}
                onChange={inputChange}
            />
        </>
    );
}

function PlaceholderForm({ inputChange }: { inputChange: (e: any) => void }) {
    const metadata = useMetadata();

    return (
        <div className="vertical-layout vertical-gap2x">
            {Object.entries(metadata.caption.params).map(([placeholder, param], i) => (
                <div key={i} className="vertical-layout">
                    <h4>
                        {"<<"}
                        {placeholder}
                        {">>"}
                    </h4>
                    <InputField
                        label="Display Label"
                        name={`label-${placeholder}`}
                        value={param.label}
                        type="text"
                        onChange={inputChange}
                    />
                    <InputField
                        label="Default Value"
                        name={`default-${placeholder}`}
                        value={param.default}
                        type="text"
                        onChange={inputChange}
                    />
                </div>
            ))}
        </div>
    );
}

function PreviewForm() {
    const metadata = useMetadata();

    const [minify, setMinify] = useState(false);

    return (
        <>
            <ToggleSwitch label="Minify" labelPosition="after" onChange={setMinify} />
            <pre
                style={{
                    background: "var(--ternary-background-color)",
                    minHeight: "100px",
                    padding: "calc(var(--section-gap-vertical) * 1.5)",
                    borderRadius: "16px",
                    lineHeight: "1.5",
                    textWrap: "wrap",
                    margin: "0px",
                    overflowY: "auto",
                    width: "100%",
                    boxSizing: "border-box",
                    wordBreak: "break-all",
                }}>
                {JSON.stringify(metadata, null, minify ? 0 : 4)}
            </pre>
        </>
    );
}

function ExportForm() {
    const metadata = useMetadata();
    const useMinified = useRef<HTMLInputElement>(null);

    const exportMetadata = useCallback(() => {
        const minified = useMinified.current?.checked;
        const data = JSON.stringify(metadata, null, minified ? 0 : 4);

        const blob = new Blob([data], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "metadata.json";
        a.click();

        URL.revokeObjectURL(url);
    }, [metadata]);

    return (
        <>
            <h4>Settings</h4>
            <div className="horizontal-layout flex-align-middle" style={{ gap: "8px" }}>
                <input ref={useMinified} name="minify" id="minify" type="checkbox" defaultChecked />
                <label htmlFor="minify">Use minified metadata</label>
            </div>
            <button type="button" className="button accent" onClick={exportMetadata}>
                Export metadata
            </button>
        </>
    );
}

export default function App() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [metadata, setMetadata] = useState<Metadata>({
        title: "",
        subtitle: "",
        width: 0,
        height: 0,
        lastLayerIndex: 0,
        caption: {
            template: "",
            params: {},
        },
    });

    const inputChange = useCallback((e: any) => {
        const { name, type, value } = e.currentTarget;

        setMetadata(
            (prev): Metadata => ({ ...prev, [name]: type === "number" ? Number(value) : value })
        );
    }, []);
    const captionChange = useCallback((e: any) => {
        let { value }: { value: string } = e.currentTarget;

        // Get all placeholders in the template (format: <<placeholder>>)
        const placeholders = [...value.matchAll(/<<([^>]+)>>/g)].map((m) => m[1]);
        const capsPlaceholders = placeholders.map((p) =>
            p.toUpperCase().replace(/[^a-zA-Z]+|\s+/g, (m) => {
                if (/\s|_/.test(m)) return "_";
                return "";
            })
        );

        // Replace all placeholders in the value with capsPlaceholders
        value = placeholders.reduce(
            (acc, p, index) => acc.replace(`<<${p}>>`, `<<${capsPlaceholders[index]}>>`),
            value
        );

        const params = capsPlaceholders.reduce<MetadataParamList>(
            (acc, p): MetadataParamList => ({ ...acc, [p]: { label: p, default: `[${p}]` } }),
            {}
        );

        setMetadata(
            (prev): Metadata => ({ ...prev, caption: { ...prev.caption, template: value, params } })
        );
    }, []);
    const placeholderChange = useCallback((e: any) => {
        const { name, value }: { name: string; value: string } = e.currentTarget;
        const [key, placeholder] = name.split("-");

        console.log(placeholder);

        setMetadata(
            (prev): Metadata => ({
                ...prev,
                caption: {
                    ...prev.caption,
                    params: {
                        ...prev.caption.params,
                        [placeholder]: {
                            ...prev.caption.params[placeholder],
                            [key]: value,
                        },
                    },
                },
            })
        );
    }, []);

    const steps: Step[] = [
        { name: "Import", page: <ImportForm /> },
        {
            name: "Provide a title and subtitle",
            page: <TitleForm inputChange={inputChange} />,
        },
        { name: "Set the size", page: <SizeForm inputChange={inputChange} /> },
        {
            name: "Adjust the layers",
            page: <LayerForm inputChange={inputChange} />,
        },
        {
            name: "Add an interesting caption",
            page: <CaptionForm inputChange={captionChange} />,
        },
        {
            name: "Identify placeholders",
            page: <PlaceholderForm inputChange={placeholderChange} />,
        },
        { name: "Preview", page: <PreviewForm /> },
        { name: "Export", page: <ExportForm /> },
    ];

    const switchStep = useCallback(
        (index: number) => () => {
            setCurrentIndex(index);
        },
        []
    );

    return (
        <div
            id="popup"
            className="popup vertical-layout"
            style={{
                minHeight: "100px",
                minWidth: "100px",
                transform: "none",
                boxShadow: "0 0 64px 0 hsla(0, 0%, 0%, 0.01)",
            }}>
            <div className="horizontal-layout">
                <div className="icon-landscape" style={{ marginLeft: "0" }}>
                    <img src="/icon.svg" alt={`$TwiProj Icon`} />
                    <div>TwiProj</div>
                </div>
            </div>
            <div id="popup-container">
                <div className="vertical-layout flex-align-center popup-content">
                    <div className="horizontal-layout">
                        <div
                            id="left-side"
                            className="vertical-layout"
                            style={{
                                position: "sticky",
                                top: "0",
                                left: "0",
                                flex: "0 0 20dvw",
                                gap: "calc(var(--section-gap-vertical) * .5)",
                                height: "100%",
                            }}>
                            {steps.map((step, index) => (
                                <div
                                    key={index}
                                    className={index === currentIndex ? "active-step" : ""}
                                    onClick={switchStep(index)}>
                                    {step.name}
                                </div>
                            ))}
                        </div>
                        <div id="right-side" className="vertical-layout flex-fill">
                            <h3>{steps[currentIndex].name}</h3>
                            <MetadataContext.Provider value={metadata}>
                                {steps[currentIndex].page}
                            </MetadataContext.Provider>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
