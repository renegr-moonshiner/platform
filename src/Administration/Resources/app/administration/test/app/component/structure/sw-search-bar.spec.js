/* eslint-disable max-len */
import { shallowMount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import 'src/app/component/structure/sw-search-bar';

const { Module } = Shopware;
const register = Module.register;

const swSearchBarComponent = Shopware.Component.build('sw-search-bar');
const searchTypeServiceTypes = {
    product: {
        entityName: 'product',
        entityService: 'productService',
        placeholderSnippet: 'sw-product.general.placeholderSearchBar',
        listingRoute: 'sw.product.index'
    },
    category: {
        entityName: 'category',
        entityService: 'categoryService',
        placeholderSnippet: 'sw-category.general.placeholderSearchBar',
        listingRoute: 'sw.category.index'
    },
    customer: {
        entityName: 'customer',
        entityService: 'customerService',
        placeholderSnippet: 'sw-customer.general.placeholderSearchBar',
        listingRoute: 'sw.customer.index'
    },
    order: {
        entityName: 'order',
        entityService: 'orderService',
        placeholderSnippet: 'sw-order.general.placeholderSearchBar',
        listingRoute: 'sw.order.index'
    },
    media: {
        entityName: 'media',
        entityService: 'mediaService',
        placeholderSnippet: 'sw-media.general.placeholderSearchBar',
        listingRoute: 'sw.media.index'
    }
};

const spyLoadTypeSearchResults = jest.spyOn(swSearchBarComponent.methods, 'loadTypeSearchResults');
const spyLoadTypeSearchResultsByService = jest.spyOn(swSearchBarComponent.methods, 'loadTypeSearchResultsByService');

function createWrapper(props, searchTypes = searchTypeServiceTypes, privileges = []) {
    const localVue = createLocalVue();

    return shallowMount(swSearchBarComponent, {
        localVue,
        stubs: {
            'sw-icon': true,
            'sw-version': true,
            'sw-loader': true,
            'sw-search-more-results': true,
            'sw-search-bar-item': true
        },
        mocks: {
            $route: {
                query: {
                    term: ''
                }
            }
        },
        provide: {
            searchService: {
                search: () => Promise.resolve({ data: [] })
            },
            repositoryFactory: {
                create: (entity) => ({
                    search: () => {
                        if (entity === 'sales_channel') {
                            return Promise.resolve([{
                                id: '8a243080f92e4c719546314b577cf82b',
                                translated: { name: 'Storefront' },
                                type: { translated: { name: 'Storefront' } }
                            }]);
                        }

                        if (entity === 'sales_channel_type') {
                            return Promise.resolve([{
                                id: 'xxxxxxx',
                                translated: { name: 'Storefront' }
                            }]);
                        }

                        const result = [
                            {
                                name: 'Home',
                                id: '12345'
                            }, {
                                name: 'Electronics',
                                id: '55523'
                            }
                        ];
                        result.total = 2;

                        return Promise.resolve(result);
                    }
                })
            },
            searchTypeService: {
                getTypes: () => searchTypes
            },
            acl: {
                can: (identifier) => {
                    if (!identifier) { return true; }

                    return privileges.includes(identifier);
                }
            }
        },
        propsData: props
    });
}


describe('src/app/component/structure/sw-search-bar', () => {
    /** @type Wrapper */
    let wrapper;

    beforeAll(() => {
        const apiService = Shopware.Application.getContainer('factory').apiService;
        apiService.register('categoryService', {
            getList: () => {
                const result = [];
                result.meta = {
                    total: 0
                };

                return Promise.resolve(result);
            }
        });
    });

    beforeEach(() => {
        Module.getModuleRegistry().clear();
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.destroy();
        }
    });

    it('should be a Vue.js component', async () => {
        wrapper = await createWrapper({
            initialSearchType: 'product'
        });

        expect(wrapper.vm).toBeTruthy();
    });

    it('should show the tag overlay on click and not the search results', async () => {
        wrapper = await createWrapper({
            initialSearchType: 'product'
        });

        // open search
        const searchInput = wrapper.find('.sw-search-bar__input');
        await searchInput.trigger('focus');

        // check if search results are hidden and types container are visible
        const searchResults = wrapper.find('.sw-search-bar__results');
        const typesContainer = wrapper.find('.sw-search-bar__types_container');

        expect(searchResults.exists()).toBe(false);
        expect(typesContainer.exists()).toBe(true);

        // check if active type is default type
        const activeType = wrapper.find('.sw-search-bar__field .sw-search-bar__type');
        expect(activeType.text()).toBe('global.entities.product');
    });

    it('should hide the tags and not show the search results when initialSearchType and currentSearchType matches', async () => {
        wrapper = await createWrapper({
            initialSearchType: 'product'
        });

        // open search
        const searchInput = wrapper.find('.sw-search-bar__input');
        await searchInput.trigger('focus');

        // check if search results are hidden and types container are visible
        let searchResults = wrapper.find('.sw-search-bar__results');
        let typesContainer = wrapper.find('.sw-search-bar__types_container');

        expect(searchResults.exists()).toBe(false);
        expect(typesContainer.exists()).toBe(true);

        // type search value
        await searchInput.setValue('shirt');
        await flushPromises();

        const debouncedDoListSearchWithContainer = swSearchBarComponent.methods.doListSearchWithContainer;
        await debouncedDoListSearchWithContainer.flush();

        await flushPromises();

        // check if search results and types container are hidden
        searchResults = wrapper.find('.sw-search-bar__results');
        typesContainer = wrapper.find('.sw-search-bar__types_container');

        expect(searchResults.exists()).toBe(false);
        expect(typesContainer.exists()).toBe(false);
    });

    it('should hide the tags and show the search results when initialSearchType and currentSearchType are not matching', async () => {
        wrapper = await createWrapper({
            initialSearchType: 'product'
        });

        const searchInput = wrapper.find('.sw-search-bar__input');

        // open search
        await searchInput.trigger('focus');

        // check if search results are hidden and types container are visible
        let searchResults = wrapper.find('.sw-search-bar__results');
        let typesContainer = wrapper.find('.sw-search-bar__types_container');

        expect(searchResults.exists()).toBe(false);
        expect(typesContainer.exists()).toBe(true);

        // set categories as active type
        const typeItems = wrapper.findAll('.sw-search-bar__types_container .sw-search-bar__type-item');
        const secondTypeItem = typeItems.at(1);
        await secondTypeItem.trigger('click');

        // open search again
        await searchInput.trigger('focus');

        // check if new type is set
        const activeType = wrapper.find('.sw-search-bar__field .sw-search-bar__type');
        expect(activeType.text()).toBe('global.entities.category');

        // type search value
        await searchInput.setValue('shorts');
        await flushPromises();

        const debouncedDoListSearchWithContainer = swSearchBarComponent.methods.doListSearchWithContainer;
        await debouncedDoListSearchWithContainer.flush();

        await flushPromises();

        // check if search results are visible and types are hidden
        searchResults = wrapper.find('.sw-search-bar__results');
        typesContainer = wrapper.find('.sw-search-bar__types_container');

        expect(searchResults.exists()).toBe(true);
        expect(typesContainer.exists()).toBe(false);

        // check if search result is empty
        expect(searchResults.find('.sw-search-bar__results-empty-message').exists()).toBe(true);
    });

    it('should not modify search term in $route watcher when focus is on input', async () => {
        wrapper = await createWrapper({
            initialSearchType: 'product'
        });

        // open search
        const searchInput = wrapper.find('.sw-search-bar__input');
        await searchInput.trigger('focus');

        const route = {
            query: {
                term: 'Foo product'
            }
        };

        wrapper.vm.$options.watch.$route.call(wrapper.vm, route);

        expect(wrapper.vm.searchTerm).toBe('');
    });

    it('should modify search term in $route watcher when focus is not on input', async () => {
        wrapper = await createWrapper({
            initialSearchType: 'product'
        });

        const route = {
            query: {
                term: 'Foo product'
            }
        };

        wrapper.vm.$options.watch.$route.call(wrapper.vm, route);

        expect(wrapper.vm.searchTerm).toBe('Foo product');
    });

    it('should search with repository when no service is set in searchTypeService', async () => {
        wrapper = await createWrapper(
            {
                initialSearchType: 'product'
            },
            {
                product: {
                    entityName: 'product',
                    placeholderSnippet: 'sw-product.general.placeholderSearchBar',
                    listingRoute: 'sw.product.index'
                },
                category: {
                    entityName: 'category',
                    placeholderSnippet: 'sw-category.general.placeholderSearchBar',
                    listingRoute: 'sw.category.index'
                },
                customer: {
                    entityName: 'customer',
                    placeholderSnippet: 'sw-customer.general.placeholderSearchBar',
                    listingRoute: 'sw.customer.index'
                },
                order: {
                    entityName: 'order',
                    placeholderSnippet: 'sw-order.general.placeholderSearchBar',
                    listingRoute: 'sw.order.index'
                },
                media: {
                    entityName: 'media',
                    placeholderSnippet: 'sw-media.general.placeholderSearchBar',
                    listingRoute: 'sw.media.index'
                }
            }
        );

        const searchInput = wrapper.find('.sw-search-bar__input');

        // open search
        await searchInput.trigger('focus');

        // set categories as active type
        const typeItems = wrapper.findAll('.sw-search-bar__types_container .sw-search-bar__type-item');
        const secondTypeItem = typeItems.at(1);
        await secondTypeItem.trigger('click');

        // open search again
        await searchInput.trigger('focus');

        // check if new type is set
        const activeType = wrapper.find('.sw-search-bar__field .sw-search-bar__type');
        expect(activeType.text()).toBe('global.entities.category');

        // type search value
        await searchInput.setValue('shorts');
        await flushPromises();

        const debouncedDoListSearchWithContainer = swSearchBarComponent.methods.doListSearchWithContainer;
        await debouncedDoListSearchWithContainer.flush();

        await flushPromises();

        // Make sure only repository method was called
        expect(spyLoadTypeSearchResults).toHaveBeenCalledTimes(1);
        expect(spyLoadTypeSearchResultsByService).toHaveBeenCalledTimes(0);

        // Verify result was applied correctly from repository
        expect(wrapper.vm.results).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    total: 2,
                    entities: expect.arrayContaining([
                        expect.objectContaining({
                            name: 'Home',
                            id: '12345'
                        }),
                        expect.objectContaining({
                            name: 'Electronics',
                            id: '55523'
                        })
                    ]),
                    entity: 'category'
                })
            ])
        );
    });

    it('should show module filters container when clicking on type dropdown', async () => {
        global.activeFeatureFlags = ['FEATURE_NEXT_6040'];
        searchTypeServiceTypes.all = {
            entityName: '',
            placeholderSnippet: '',
            listingRoute: ''
        };
        wrapper = await createWrapper();

        const searchInput = wrapper.find('.sw-search-bar__type--v2');
        await searchInput.trigger('click');

        // check if search results are hidden and types container are visible
        const moduleFiltersContainer = wrapper.find('.sw-search-bar__types_module-filters-container');
        const typesContainer = wrapper.find('.sw-search-bar__types_container');

        expect(moduleFiltersContainer.exists()).toBe(true);
        expect(typesContainer.exists()).toBe(false);
    });

    it('should change search bar type when selecting module filters from type dropdown', async () => {
        global.activeFeatureFlags = ['FEATURE_NEXT_6040'];
        wrapper = await createWrapper({
            initialSearchType: ''
        }, {
            all: {
                entityName: '',
                placeholderSnippet: '',
                listingRoute: ''
            },
            ...searchTypeServiceTypes
        });

        const moduleFilterSelect = wrapper.find('.sw-search-bar__type--v2');
        await moduleFilterSelect.trigger('click');

        const moduleFilterItems = wrapper.findAll('.sw-search-bar__type-item');
        await moduleFilterItems.at(1).trigger('click');

        expect(moduleFilterSelect.text()).toBe('global.entities.product');
    });

    it('should search with repository after selecting module filter', async () => {
        global.activeFeatureFlags = ['FEATURE_NEXT_6040'];
        wrapper = await createWrapper(
            {
                initialSearchType: 'product'
            },
            {
                all: {
                    entityName: '',
                    placeholderSnippet: '',
                    listingRoute: ''
                },
                product: {
                    entityName: 'product',
                    placeholderSnippet: 'sw-product.general.placeholderSearchBar',
                    listingRoute: 'sw.product.index'
                },
                category: {
                    entityName: 'category',
                    placeholderSnippet: 'sw-category.general.placeholderSearchBar',
                    listingRoute: 'sw.category.index'
                },
                customer: {
                    entityName: 'customer',
                    placeholderSnippet: 'sw-customer.general.placeholderSearchBar',
                    listingRoute: 'sw.customer.index'
                },
                order: {
                    entityName: 'order',
                    placeholderSnippet: 'sw-order.general.placeholderSearchBar',
                    listingRoute: 'sw.order.index'
                },
                media: {
                    entityName: 'media',
                    placeholderSnippet: 'sw-media.general.placeholderSearchBar',
                    listingRoute: 'sw.media.index'
                }
            }
        );

        const moduleFilterSelect = wrapper.find('.sw-search-bar__type--v2');
        await moduleFilterSelect.trigger('click');

        const moduleFilterItems = wrapper.findAll('.sw-search-bar__type-item');
        await moduleFilterItems.at(2).trigger('click');

        // open search again
        const searchInput = wrapper.find('.sw-search-bar__input');
        await searchInput.trigger('focus');

        // check if new type is set
        const activeType = wrapper.find('.sw-search-bar__field .sw-search-bar__type--v2');
        expect(activeType.text()).toBe('global.entities.category');

        // type search value
        await searchInput.setValue('shorts');
        await flushPromises();

        const debouncedDoListSearchWithContainer = swSearchBarComponent.methods.doListSearchWithContainer;
        await debouncedDoListSearchWithContainer.flush();

        await flushPromises();

        // Make sure only repository method was called
        expect(spyLoadTypeSearchResults).toHaveBeenCalledTimes(1);
        expect(spyLoadTypeSearchResultsByService).toHaveBeenCalledTimes(0);

        // Verify result was applied correctly from repository
        expect(wrapper.vm.results).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    total: 2,
                    entities: expect.arrayContaining([
                        expect.objectContaining({
                            name: 'Home',
                            id: '12345'
                        }),
                        expect.objectContaining({
                            name: 'Electronics',
                            id: '55523'
                        })
                    ]),
                    entity: 'category'
                })
            ])
        );
    });

    it('should search for module and action with a default module', async () => {
        global.activeFeatureFlags = ['FEATURE_NEXT_6040'];

        register('sw-order', {
            title: 'Orders',
            color: '#A092F0',
            icon: 'default-shopping-paper-bag',
            entity: 'order',

            routes: {
                index: {
                    component: 'sw-order-list',
                    path: 'index',
                    meta: {
                        privilege: 'order.viewer'
                    }
                },

                create: {
                    component: 'sw-order-create',
                    path: 'create',
                    meta: {
                        privilege: 'order.creator'
                    }
                }
            }
        });

        wrapper = await createWrapper(
            {
                initialSearchType: '',
                initialSearch: ''
            },
            searchTypeServiceTypes,
            ['order.viewer', 'order.creator']
        );

        // open search
        const searchInput = wrapper.find('.sw-search-bar__input');
        await searchInput.trigger('focus');

        await searchInput.setValue('ord');
        expect(searchInput.element.value).toBe('ord');

        await flushPromises();

        const doGlobalSearch = swSearchBarComponent.methods.doGlobalSearch;
        await doGlobalSearch.flush();

        await flushPromises();

        const module = wrapper.vm.results[0];

        expect(module.entity).toBe('module');
        expect(module.total).toBe(2);

        expect(module.entities[0].route.name).toBe('sw.order.index');
        expect(module.entities[1].route.name).toBe('sw.order.create');
    });

    it('should search for module and action with config module', async () => {
        global.activeFeatureFlags = ['FEATURE_NEXT_6040'];

        register('sw-category', {
            title: 'Categories',
            color: '#57D9A3',
            icon: 'default-symbol-products',
            entity: 'category',

            searchMatcher: (regex, labelType, manifest) => {
                const match = labelType.toLowerCase().match(regex);

                if (!match) {
                    return false;
                }

                return [
                    {
                        icon: manifest.icon,
                        color: manifest.color,
                        label: labelType,
                        entity: manifest.entity,
                        route: manifest.routes.index
                    },
                    {
                        icon: manifest.icon,
                        color: manifest.color,
                        route: { name: 'sw.category.landingPageDetail', params: { id: 'create' } },
                        entity: 'landing_page',
                        privilege: manifest.routes.landingPageDetail?.meta.privilege,
                        action: true
                    }
                ];
            },

            routes: {
                index: {
                    components: 'sw-category-detail',
                    meta: {
                        privilege: 'category.viewer'
                    }
                },

                landingPageDetail: {
                    component: 'sw-category-detail',
                    meta: {
                        privilege: 'category.viewer'
                    }
                }
            }
        });

        wrapper = await createWrapper(
            {
                initialSearchType: '',
                initialSearch: ''
            },
            searchTypeServiceTypes,
            ['category.viewer']
        );

        // open search
        const searchInput = wrapper.find('.sw-search-bar__input');
        await searchInput.trigger('focus');

        await searchInput.setValue('cat');
        expect(searchInput.element.value).toBe('cat');

        await flushPromises();

        const doGlobalSearch = swSearchBarComponent.methods.doGlobalSearch;
        await doGlobalSearch.flush();

        await flushPromises();

        const module = wrapper.vm.results[0];

        expect(module.entity).toBe('module');
        expect(module.total).toBe(2);

        expect(module.entities[0].route.name).toBe('sw.category.index');
        expect(module.entities[1].route.name).toBe('sw.category.landingPageDetail');
        expect(module.entities[1].route.params).toEqual({ id: 'create' });
    });

    it('should search for module and action with sales channel', async () => {
        global.activeFeatureFlags = ['FEATURE_NEXT_6040'];

        wrapper = await createWrapper(
            {
                initialSearchType: '',
                initialSearch: ''
            },
            searchTypeServiceTypes,
            ['sales_channel.viewer', 'sales_channel.creator']
        );

        // open search
        const searchInput = wrapper.find('.sw-search-bar__input');
        await searchInput.trigger('focus');

        await searchInput.setValue('sto');
        expect(searchInput.element.value).toBe('sto');

        await flushPromises();

        const doGlobalSearch = swSearchBarComponent.methods.doGlobalSearch;
        await doGlobalSearch.flush();

        await flushPromises();

        const searchBarItemStub = wrapper.find('sw-search-bar-item-stub');
        expect(searchBarItemStub.attributes().type).toBe('module');

        const module = wrapper.vm.results[0];

        expect(module.entity).toBe('module');
        expect(module.total).toBe(2);
        expect(module.entities[0].label).toBe('Storefront');
        expect(module.entities[0].route.name).toBe('sw.sales.channel.detail');
        expect(module.entities[1].label).toBe('Storefront');
        expect(module.entities[1].route.name).toBe('sw.sales.channel.create');
    });

    ['order', 'product', 'customer'].forEach(term => {
        it(`should search for module and action with the term "${term}" when the ACL privilege is missing`, async () => {
            global.activeFeatureFlags = ['FEATURE_NEXT_6040'];

            register(`sw-${term}`, {
                title: `${term}s`,
                color: '#A092F0',
                icon: 'default-shopping-paper-bag',
                entity: term,

                routes: {
                    index: {
                        component: `sw-${term}-list`,
                        path: 'index',
                        meta: {
                            privilege: `${term}.viewer`
                        }
                    },

                    create: {
                        component: `sw-${term}-create`,
                        path: 'create',
                        meta: {
                            privilege: `${term}.creator`
                        }
                    }
                }
            });

            wrapper = await createWrapper(
                {
                    initialSearchType: '',
                    initialSearch: ''
                }
            );

            // open search
            const searchInput = wrapper.find('.sw-search-bar__input');
            await searchInput.trigger('focus');

            await searchInput.setValue(term);
            expect(searchInput.element.value).toBe(term);

            await flushPromises();

            const doGlobalSearch = swSearchBarComponent.methods.doGlobalSearch;
            await doGlobalSearch.flush();

            await flushPromises();

            expect(wrapper.vm.results).toEqual([]);
        });
    });

    ['order', 'product', 'customer'].forEach(term => {
        it(`should search for module and action with the term "${term}" when the ACL is can view`, async () => {
            global.activeFeatureFlags = ['FEATURE_NEXT_6040'];

            register(`sw-${term}`, {
                title: `${term}s`,
                color: '#A092F0',
                icon: 'default-shopping-paper-bag',
                entity: term,

                routes: {
                    index: {
                        component: `sw-${term}-list`,
                        path: 'index',
                        meta: {
                            privilege: `${term}.viewer`
                        }
                    },

                    create: {
                        component: `sw-${term}-create`,
                        path: 'create',
                        meta: {
                            privilege: `${term}.creator`
                        }
                    }
                }
            });

            wrapper = await createWrapper(
                {
                    initialSearchType: '',
                    initialSearch: ''
                },
                searchTypeServiceTypes,
                [`${term}.viewer`]
            );

            // open search
            const searchInput = wrapper.find('.sw-search-bar__input');
            await searchInput.trigger('focus');

            await searchInput.setValue(term);
            expect(searchInput.element.value).toBe(term);

            await flushPromises();

            const doGlobalSearch = swSearchBarComponent.methods.doGlobalSearch;
            await doGlobalSearch.flush();

            await flushPromises();

            const module = wrapper.vm.results[0];

            expect(module.entity).toBe('module');
            expect(module.total).toBe(1);

            expect(module.entities[0].icon).toBe('default-shopping-paper-bag');
            expect(module.entities[0].color).toBe('#A092F0');
            expect(module.entities[0].label).toBe(`${term}s`);
            expect(module.entities[0].entity).toBe(term);
            expect(module.entities[0].route.name).toBe(`sw.${term}.index`);
            expect(module.entities[0].privilege).toBe(`${term}.viewer`);
        });
    });
});
