async function save(e) {
  e.preventDefault();
  try {
    const data = $(this).serializeJSON({
      checkboxUncheckedValue: "false",
      useIntKeysAsArrayIndex: true,
    });
    data.cascadesInstances = _.compact(data.cascadesInstances || []);
    data.cascadesInstances.forEach(x => x.sections = _.compact(x.sections || []));
    console.log("Form data", data);
    
    for (const cascadesInstance of data.cascadesInstances) {
      if (!_validateRequired("Gmail address", _validateEmail(cascadesInstance.address))) {
        return false;
      }
      if (cascadesInstance.address === false) {
        return false;
      }

      for (const section of cascadesInstance.sections || []) {
        console.log("Validating", section);
        if (!_validateRequired("Inbox section name", section.name)) {
          return false;
        }
        const limit = _validateInt(section.limit);
        if (limit === false) {
          return false;
        }
        section.limit = limit;
      }
    }
    console.log("Saving", data);

    await saveSettings(data);

    _flashMessage("Saved! You should reload your Gmail or Inbox tabs to reflect the changes.");
    return false;
  } catch (e) {
    console.log("Exception", e);
    return false;
  }
}

function _flashMessage(msg) {
  $(".message").text(msg).show();
  window.scrollTo(0, 0);
  $("html, body").animate({scrollTop: 0}, "slow");
}

function _validateRequired(field, val) {
  if (!val || !val.trim()) {
    _flashMessage(`Must supply a value for ${field}`);
    return false;
  }
  return val;
}

function _validateEmail(email) {
  if (email && email.indexOf("@") < 0) {
    _flashMessage(`Invalid email: ${email}`);
    return false;
  }
  return email;
}

function _validateInt(num) {
  const val = parseInt(num);
  if (isNaN(val)) {
    _flashMessage(`Invalid number ${num}`);
    return false;
  }
  return val;
}

function _validateUrl(url) {
  if (url.length === 0) {
    _flashMessage("You must specify your Gerrit URL!");
    return false;
  }
  if (!(url.indexOf("http://") === 0 || url.indexOf("https://") === 0)) {
   _flashMessage(`Invalid URL; make sure it starts with http:// or https://: ${url}`);
    return false;
  }

  if (url.lastIndexOf("/") === (url.length - 1)) {
    url = url.substring(0, url.length - 1);
  } 
  return url;
}

const DEFAULT_CASCADES_INSTANCE_OPTIONS = {
  sections: [{name: "", limit: 5}]
};

async function load() {
  const settings = await loadSettings();
  console.log("Deserialized settings", settings);
  const cascadesInstances = settings.cascadesInstances || [];
  
  $cascadesInstances = $("#cascades-instances-group");
  if (cascadesInstances.length == 0) {
    $cascadesInstances.append(createCascadesInstanceGroup(0, DEFAULT_CASCADES_INSTANCE_OPTIONS));
  }  else {
    for (const [index, value] of cascadesInstances.entries()) {
      $cascadesInstances.append(createCascadesInstanceGroup(index, value));
    }
  }

  let nextIndex = $(".cascades-instance").length;
  $(".add-cascades").click(() => {
    $cascadesInstances.append(createCascadesInstanceGroup(nextIndex, DEFAULT_CASCADES_INSTANCE_OPTIONS));
    nextIndex += 1;
  });
}


function createCascadesInstanceGroup(index, data) {
  const $group = $("#cascades-instance-template").clone();
  $("input", $group).each(function() {
    const realName = $(this).attr("name").replace("${index}", `${index}`);
    $(this).attr("name", realName);
  });
  const $tbody = $(".sections-table-body", $group);
  if (data) {
    for (const key of ["address"]) {
      const inputName = `cascadesInstances[${index}][${key}]`;
      const $input = $(`input[name="${inputName}"]`, $group);
      const val = data[key];
      $input.val(val);
    }

    for (const [sectionIndex, section] of (data.sections || []).entries()) {
      const $section = createSectionRow(index, sectionIndex, section);
      $section.appendTo($tbody);
    }
  }
  let nextIndex = $(".section-row", $group).length;
  $(".add-section", $group).click(() => {
    const $section = createSectionRow(index, nextIndex, DEFAULT_CASCADES_INSTANCE_OPTIONS.sections[0]);
    $section.appendTo($tbody);
    nextIndex += 1;
  });
  $(".remove-cascades-instance", $group).click(() => {
    $group.slideUp("fast", function() {$(this).remove();});
  });
  return $group.removeAttr("id").slideDown("fast");
}

function createSectionRow(cascadeIndex, sectionIndex, section) {
  const $section = $("#section-template").clone().show().removeAttr("id");
  for (const key of ["name", "limit"]) {
    const inputName = "cascadesInstances[${index}][sections][${sectionIndex}][" + key + "]";
    const $input = $(`input[name="${inputName}"]`, $section);
    $input.attr("name", `cascadesInstances[${cascadeIndex}][sections][${sectionIndex}][${key}]`);
    $input.val(section[key]);
  }
  $(".delete-section", $section).click(() => {
    $section.remove();
  });
  return $section;
}


function init() {
  $(".options-form").submit(save);
  load();
  $("form").on("click", ".help-icon", function() {
    const $parent = $(this).closest(".form-row");
    $(".form-help", $parent).toggle("fast");
  });
}

$(init);
