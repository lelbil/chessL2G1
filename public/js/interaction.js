/*global $*/
/*global utilities*/
$(document).ready(function(){
	$(".dropdown-toggle").dropdown();
});
var modal = document.getElementById("modaldiv");
var joinButtonDrop = document.getElementById("joinButtonDrop");
var selectSave = document.getElementById("selectSave");
var loadSaveButton = document.getElementById("loadSave");
var linkOutput = document.getElementById("linkoutput");
var goLinkButton = document.getElementById("goLink");
var fastButtonDrop = document.getElementById("fastButtonDrop");
if(joinButtonDrop)
{
	joinButtonDrop.addEventListener("click", function(e)
	{
		e.preventDefault;
		e.stopPropagation;
		if(modal)
		{
			modal.style.display = "initial";
			if(selectSave && !selectSave.dataLoaded)
			{
				$.ajax({
					url:"/getGameSaved",
					dataType : "json"
				}).done(function(data, status, hr)
				{

					data.forEach(function(val){
						let opt = document.createElement("option");
						opt.value = val;
						opt.innerHTML = val;
						selectSave.appendChild(opt);
					});
					selectSave.dataLoaded = true;
				});
			}
		}
	});
}
if(fastButtonDrop)
{
	fastButtonDrop.addEventListener("click", function(e){
		e.preventDefault;
		e.stopPropagation;
		e.clicked = true;

		let query = $.ajax({
			url:"/p",
			dataType : "json"
		}).done(function(data, status, hr){
			if(data && data.id)
			{
				window.location.href = window.location.origin + "/p/"+data.id;
			}
		}).fail(function(xhr, text , error){
			if(text == "abort")
				utilities.generatePopup("#cfc", "Recherche de partie annulée", 1000);
			else
			{
				utilities.generatePopup("#e55", `Erreur : Recherche indisponible`, 2000);
				searchingPopup.remove();
			}
		});
		var searchingPopup = utilities.generatePopup("#aaa", "<img src='/img/loading.gif' style='float:left; height:50px; width:50px; border-radius:25px;background-color=#aaa;'></img>   Recherche de partie en cours", -1, true, function(){
			query.abort();
		});
	});
}



if(modal)
{
	modal.addEventListener("click", function()
	{
		modal.style.display = "none";
	});
	var modalcontent = document.getElementById("modaldivcontent");
	if(modalcontent)
	{
		modalcontent.addEventListener("click", function(e){
			e.stopPropagation();
		});
	}

	var joinGameButton = document.getElementById("rejoindre");
	if(joinGameButton)
	{
		joinGameButton.addEventListener("click", function(elmt)
		{
			var inputId = document.getElementById("inputid");
			if(inputId)
			{
				let val = inputId.value.toUpperCase();
				if(val)
				{
					$.ajax({
						url: "/pexist/"+val,
						dataType : "text"
					}).done(function(data){
						if(data == "yes")
						{
							window.location.href = window.location.origin+ "/p/" + val;
						}else
						{
							alert("La partie demandée n'existe pas");
						}
					});
				}
			}
		});
	}
	if(loadSaveButton)
	{
		loadSaveButton.addEventListener("click", function(e){
			if(selectSave && selectSave.dataLoaded)
			{
				if(linkOutput && selectSave.value)
				{
					$.ajax({
						url:"/loadSave/"+selectSave.value,
						dataType : "text",
						cache : false
					}).done(function(data, status, hr)
					{
						if(status == 'success')
							linkOutput.value = data;
					});
				}
			}
		});
	}
	if(goLinkButton)
	{
		goLinkButton.addEventListener("click", function(e){
			if(linkOutput && linkOutput.value)
			{
				$.ajax({
					url: "/pexist/"+linkOutput.value,
					dataType : "text"
				}).done(function(data){
					if(data == "yes")
					{
						window.location.href = window.location.origin+ "/p/" + linkOutput.value;
					}else
					{
						alert("La partie demandée n'existe pas");
					}
				});
			}
		});
	}
}
