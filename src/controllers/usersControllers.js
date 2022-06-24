const { validationResult } = require('express-validator');
const db = require('../database/models');
const Rol = db.Roles;
const Provincia = db.Provincia;
const Localidad = db.Localidad;
const User = db.Usuarios;
const Producto = db.Productos;
const Estado = db.Estados;
const bcrypt = require('bcryptjs');
// NO LA ESTAMOS USANDO POR EL MOMENTO

const { Op } = require("sequelize");
const res = require('express/lib/response');
const moment = require('moment');
const { restart } = require('nodemon');
const { load } = require('nodemon/lib/config');
const Logger = require('nodemon/lib/utils/log');


// ********************************************* //
//Aqui tienen otra forma de llamar a cada uno de los modelos



const controller = {
	login: (req, res) => {

		// res.render('./users/login', { users: " " });

        res.render('./users/login', {user:req.session.usuarioLogueado});
		
    },    
	proccessLogin: (req, res) =>{
				let resultValidation = validationResult(req);
				if (resultValidation.isEmpty()) {
					User.findOne({
						where:{
							nombreUsuario: req.body.user,
							claveIngreso: req.body.password
						}
					})
					.then((resultado)=>{
							if(req.body.recordame){
								res.cookie('user', req.body.user,{maxAge: (1000*60)*15})
							}
							req.session.usuario = resultado;
							res.redirect('../');
					}).catch(
						e=>res.render('./users/login', {error: "Las credenciales no son validas"})
						);	

				} else {
					res.render('./users/login', {errors: resultValidation.mapped()});
				} 
	

	},
    register: (req, res) => {	
		Provincia.findAll().then((resultadoProv)=>{
			Localidad.findAll().then((resultadoLoc)=>{
				res.render('./users/register',{provincias:resultadoProv, localidades:resultadoLoc})	
			})
		}).catch(error => res.send(error))
	},

	store: (req, res) => {
		let error= ""; 
		User.findAll(
			{ where: { email: req.body.email } }
		  ).then((users) => {
			if(users.length > 0){
				error = 'El email ya existe en la base de datos';
			}})

			let errores =  validationResult(req);
			let image = req.file ? req.file.filename : (req.params.id != '-1') ? req.params.id : "user.png";
			if (!errores.isEmpty() || error == "") {
				Provincia.findAll().then((resultadoProv)=>{
					Localidad.findAll().then((resultadoLoc)=>{
						res.render('./users/register', {errores: errores.mapped(), error, image, old:req.body, provincias:resultadoProv, localidades:resultadoLoc});
					})
				})
			}else{
				User.create({
					nombres: req.body.nombre,
					apellidos: req.body.apellido,
					imagen: req.file ? req.file.filename : "user.png",
					email: req.body.email,
					activo: 1,
					nombreUsuario: req.body.usuario,
					claveIngreso: req.body.contrasenia,
					telefono: req.body.telefono,
					codigoPostal: req.body.cp,
					direccion: req.body.direccion,
					dni: req.body.dni,
					fechaCreacion: Date.now(),
					localidadId: req.body.localidad,
					rolesId: 3,
				})
					.then((storedUser) => {
						return res.redirect('./login');
					}).catch(error => console.log(error));
			}
	},
	logout: (req, res) => {
		res.clearCookie('user')
		res.locals.isLogged = false;
		req.session.destroy();
		res.redirect('/');

	},
	// Edit - Form to edit
	Edit: (req, res) => {
		// res.render('./users/edit')
		User.findByPk(req.params.id, { include: ["roles", "localidad", "estados"] }).then((result) => {
			// res.send(result);
			let userRoles = result
			Rol.findAll().then((result) => {
				let rolesUser = result.filter(e => e.descripcion);
				Provincia.findAll().then((result) => {
					// res.send(result);
					let provincias = result.filter(e => e.provincia);

					Localidad.findAll({ include: ["provincia"] }).then((result) => {
						let localidades = result.filter(e => e.localidad)
						let provi = result.filter(e => e.provincia.id) // las 24 provincias
						Estado.findAll().then((result) => {
							// res.send(result);
							let estados = result.filter(e => e.descripcion);



							res.render('./users/edit', { userRoles, provi, provincias, rolesUser, localidades, estados })
						})
					})
				})
			})
		}).catch(error => res.send(error))
	},
	// Update - Method to update
	Update: (req, res) => {
	
		User.update({
			apellidos: req.body.surname,
			nombres: req.body.name,
			nombreUsuario: req.body.user,
			email: req.body.mail,
			dni: req.body.document,
			direccion: req.body.address,
			localidadId: req.body.localidad,
			codigoPostal: req.body.cp,
			telefono: req.body.phone,
			imagen: req.file ? req.file.filename : req.body.avatar,
			estadosId: req.body.state,
			claveIngreso: bcrypt.hashSync(req.body.resetPassword, 10),
			fechaCreacion: Date.now(),
			rolesId: req.body.roles
		}, {
			where: { id: req.params.id }

		}).then((product) => {
			res.redirect('/users/list');

		})
	},

	Index: (req, res) => {
		res.render('./users/index')

	},
	List: (req, res) => {

		User.findAll().then((result) => {

			res.render('./users/list', { result })
		})
	},

	Search: (req, res) => {
		let search = req.query.search;
		Producto.findAll({
			where: {
				[Op.or]: [
					{ nombre: { [Op.like]: '%' + search + '%' } },
					{ descripcion: { [Op.like]: '%' + search + '%' } }
				]
			}
		}).then((product) => {

			product.reverse();
			res.render('/users/search', { search, product, toThousand })
		})
	}, // veo si lo puedo hacer

	Roles: (req, res) => {

		Rol.findAll().then((result) => {
			res.render('./users/roles/list', { result })
		}).catch(error => res.send(error))
	},
	// Edit - one category
	Roledit: (req, res) => {

		Rol.findByPk(req.params.id, { include: ["usuarios"] }).then((result) => {
			let user = result
			res.render('./users/roles/edit', { user })


		})
	},
	// Update - Method to update
	Rolupdate: (req, res) => {

		Rol.update({
			descripcion: req.body.name,

		}, {
			where: { id: req.params.id }

		}).then((result) => {

			res.redirect('/users/roles/list');

		}).catch(error => res.send(error));
		
	
	},
	// Create one category
	Rolcreate: (req, res) => {

		res.render('./users/roles/create')

	},
	// Create -  Method to save
	Rolsave: (req, res) => {

		Rol.create({

			descripcion: req.body.name
		}).then((resul) => {

			// console.alert("Creaste el usuario");

			res.redirect('/users/roles/list');

		}).catch(error => res.send(error))
	},

	// Delete - Delete one Rol

	Roldelet: (req, res) => {
		Rol.destroy({
			where: {
				id: req.params.id
			}
		})
			.then((result) => {
				let id = req.params.id;
				console.log(id);
				res.redirect('/users/roles/list');
			})


	},

}

module.exports = controller;