import React, { useMemo } from "react";
import { Routes, Route } from "react-router-dom";
import { BackofficeDirector } from "@/backoffice/core/organisms/BackofficeDirector";
import { FormPage } from "@/backoffice/ui/templates/FormPage";
import { Sidebar } from "@/backoffice/ui/organisms/Sidebar";
import { BackofficeModule } from "@/backoffice/core/molecules/BackofficeModule";
import {
  NavItem,
  FormFieldConfig,
  BackofficeFormFieldConfig,
} from "@/backoffice/core/types";
import { ListPage } from "@/backoffice/components";

const convertToFormFieldConfig = (
  fields: BackofficeFormFieldConfig[]
): FormFieldConfig[] => {
  return fields.map((field) => {
    const { type, ...rest } = field;

    let mappedType: FormFieldConfig["type"] = type as any;

    if (
      [
        "color",
        "multiselect",
        "checkbox",
        "radio",
        "datetime",
        "tel",
        "url",
      ].includes(type)
    ) {
      if (type === "multiselect" || type === "checkbox" || type === "radio") {
        mappedType = "select";
      } else if (type === "datetime") {
        mappedType = "date";
      } else if (type === "color" || type === "tel" || type === "url") {
        mappedType = "text";
      }
    }

    return {
      ...rest,
      type: mappedType,
    } as FormFieldConfig;
  });
};

const BackofficeApp: React.FC = () => {
  const apiBaseUrl = process.env.REACT_APP_API_URL ?? "http://localhost:3001";

  const backofficeModules = useMemo(() => {
    const director = new BackofficeDirector(apiBaseUrl);
    const builder = director.createBuilder();

    return [
      director.buildCustomerModule(builder),
      director.buildWarehouseModule(builder),
      director.buildInventoryModule(builder),
      director.buildOrderModule(builder),
      director.buildInventoryTransactionsModule(builder),
      director.buildInventoryReservationsModule(builder),
    ];
  }, [apiBaseUrl]);

  const navItems = useMemo(() => {
    return backofficeModules
      .filter((module) => module.navItem)
      .map((module) => module.navItem) as NavItem[];
  }, [backofficeModules]);

  const renderModuleRoutes = (module: BackofficeModule) => {
    const { basePath, title } = module.config;
    const listPath = basePath;
    const formNewPath = `${basePath}/new`;
    const formEditPath = `${basePath}/:id`;

    return (
      <React.Fragment key={basePath}>
        {module.listConfig && (
          <Route path={listPath} element={<ListPage module={module} />} />
        )}

        {module.formConfig && (
          <>
            <Route
              path={formNewPath}
              element={
                <FormPage
                  title={`New ${title}`}
                  apiEndpoint={module.apiEndpoint}
                  fields={convertToFormFieldConfig(
                    module.formConfig.fields as BackofficeFormFieldConfig[]
                  )}
                  sections={module.formConfig.sections}
                  isNew
                />
              }
            />

            <Route
              path={formEditPath}
              element={
                <FormPage
                  title={`Edit ${title}`}
                  apiEndpoint={module.apiEndpoint}
                  fields={convertToFormFieldConfig(
                    module.formConfig.fields as BackofficeFormFieldConfig[]
                  )}
                  sections={module.formConfig.sections}
                />
              }
            />
          </>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="flex h-screen">
      <Sidebar navItems={navItems ?? []} />

      <div className="flex-1 p-8 overflow-auto">
        <Routes>
          <Route path="/" element={<BackofficeHome />} />
          {backofficeModules.map(renderModuleRoutes)}
        </Routes>
      </div>
    </div>
  );
};

const BackofficeHome: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto text-center mt-16">
      <h1 className="text-3xl font-bold mb-6">Welcome to Synkro Backoffice</h1>
      <p className="text-gray-600 mb-8">
        Select a module from the sidebar to get started
      </p>
    </div>
  );
};

export default BackofficeApp;
