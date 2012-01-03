"use strict";

var pd = require('pd'),
	EventEmitter = require('eventemitter-light');

exports.nCore = pd.extend(Object.create(EventEmitter), {
	use: use,
	remove: remove,
	destroy: destroy,
	init: init,
	module: module,
	constructor: constructor
}).constructor();

/*
	Attach a module to the core.
	
	Calls the attach method of the module
	
	@param String name - name of module
	@param Object module - module to attach
*/
function use(name, module) {
	if (module === undefined) {
		return Object.keys(name).forEach(invokeUseOnModules, this);
	}

	this._modules[name] = module;

	module.attach && module.attach(this);

	if (this._initialized) {
		module.init && module.init(this);
	}

	function invokeUseOnModules(key) {
		this.use(key, name[key]);
	}
}

/*
    Create a module and attach it the core.

    A module will have bindAll called on it and will have the mediator set as
    a property of the module

    @param String name - name of module
    @param Object module - module to attach
*/
function module(name, module) {
	if (module === undefined) {
		return Object.keys(name).forEach(invokeModuleOnModule, this);
	}
	
	module = pd.bindAll(module);
	module.mediator = this;
	this.use(name, module);
	
	function invokeModuleOnModule(key) {
		this.module(key, name[key]);
	}
}

/*
	Initializes all modules attached to the core

	Calls the init method of all modules		
*/
function init() {
	var meta = this._meta,
		modules = this._modules;

	this._initialized = true;

	Object.keys(this._modules).forEach(invokeInit, this);

	function invokeInit(name) {
		var module = modules[name];
		module.init && module.init();
		meta(module).initialized = true;
	}
}

/*
	Removes a module from the core. 

	Invokes the modules detach method

	@param String name - name of module to be removed
*/
function remove(name) {
	if (typeof name !== "string") {
		return Object.keys(name).forEach(invokeRemoveOnModules, this);
	}
	
	var module = this._modules[name];

	if (this._meta(module).initialized) {
		module.destroy && module.destroy();
	}
	
	module.detach && module.detach(this);

	delete this._modules[name];

	function invokeRemoveOnModules(key) {
		this.remove(key)
	}
}

/*
	destroys and detaches all attached modules
*/
function destroy() {
	var keys = Object.keys(this._modules)
	
	keys.forEach(invokeMethodOnModules('destroy'), this);
	keys.forEach(invokeMethodOnModules('detach'), this);

	function invokeMethodOnModules(method) {
		return invokeMethodOnModules;

		function invokeMethodOnModules(propName) {
			var module = this._modules[propName];

			module[method] && module[method](this);
		}
	}
}

function constructor() {
	EventEmitter.constructor.call(this);
	this._meta = pd.Name();
	this._modules = {};

	return this;
}