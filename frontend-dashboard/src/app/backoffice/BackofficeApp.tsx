import React, { useMemo } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { BackofficeDirector } from "@/backoffice/core/organisms/BackofficeDirector";
import { ListPage } from "@/backoffice/ui/templates/ListPage";
import { FormPage } from "@/backoffice/ui/templates/FormPage";
import { Sidebar } from "@/backoffice/ui/organisms/Sidebar";
import { BackofficeModule } from "@/backoffice/core/molecules/BackofficeModule";

const BackofficeApp: React.FC = () => {
  const apiBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:3001";

  // Create backoffice director and modules
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

  // Generate navigation items from modules
  const navItems = useMemo(() => {
    return backofficeModules
      .filter((module) => module.navItem)
      .map((module) => module.navItem);
  }, [backofficeModules]);

  // Generate routes from modules
  const renderModuleRoutes = (module: BackofficeModule) => {
    const { basePath, title } = module.config;
    const listPath = basePath;
    const formNewPath = `${basePath}/new`;
    const formEditPath = `${basePath}/:id`;

    return (
      <React.Fragment key={basePath}>
        {module.listConfig && (
          <Route
            path={listPath}
            element={
              <ListPage
                title={title}
                apiEndpoint={module.apiEndpoint}
                columns={module.listConfig.columns}
                searchFields={module.listConfig.searchFields}
              />
            }
          />
        )}

        {module.formConfig && (
          <>
            <Route
              path={formNewPath}
              element={
                <FormPage
                  title={`New ${title}`}
                  apiEndpoint={module.apiEndpoint}
                  fields={module.formConfig.fields}
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
                  fields={module.formConfig.fields}
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
      <Sidebar navItems={navItems} />

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
