const {
  Input,
  Button,
  Divider,
  Icon,
  Form,
  Loader,
  Segment,
  Checkbox,
  Progress,
  Dropdown,
  List
} = semanticUIReact;

//Initiate the OpenMedia plugin libraries
const WpLib = OMWebPluginLib;
const OMApi = OMWebPluginLib.OMApi;
const builder = WpLib.Plugin.SamePageBuilder.create(); //.onNotify(onClientNotify)
const plugin = WpLib.Plugin.createPlugin(builder);
const api = plugin.getApi();

//Version of this module
const module_version = 1;

//
class NewListItemInput extends React.Component {
  constructor(props) {
    super(props);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.state = {
      focus: false,
      value: ""
    };
  }

  handleFocus(e) {
    this.setState({
      focus: true
    });
  }
  handleBlur(e) {
    this.setState({
      focus: false
    });
  }

  //When user hits enter, then commit the new value
  handleKeyPress(e) {
    const { onAddItem } = this.props;
    if (e.charCode == 13) {
      onAddItem(this.state.value);
      //reset value
      this.setState({
        value: ""
      });
    }
  }

  render() {
    return (
      <Input
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        //to do instead of transparent prop, set transparent boder and background

        {...this.props}
        placeholder="Add new item..."
        onChange={(e, data) => {
          this.setState({ value: data.value });
        }}
        onKeyPress={this.handleKeyPress}
        value={this.state.value}
      >
        <input style={{ borderColor: this.state.focus ? "" : "transparent" }} />
      </Input>
    );
  }
}

class CheckItem extends React.Component {
  constructor(props) {
    super(props);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.state = {
      focus: false,
      value: ""
    };
    this.handleToggle = this.handleToggle.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
  }

  handleToggle(e) {
    const { checkItemId, onToggleItem } = this.props;
    onToggleItem(checkItemId);
  }

  handleDelete(e) {
    const { checkItemId, onDeleteItem } = this.props;
    onDeleteItem(checkItemId);
  }
  handleFocus(e) {
    this.setState({
      focus: true
    });
  }
  handleBlur(e) {
    this.setState({
      focus: false
    });

    //when the user exit the field, then commit it to database
    const { checkItemId, onEditItem } = this.props;
    onEditItem(checkItemId, this.state.value);
  }

  render() {
    return (
      <div>
        <Button
          size="small"
          basic
          circular
          color={this.props.isChecked ? "green" : ""}
          onClick={this.handleToggle}
          icon
        >
          <Icon name={this.props.isChecked ? "check" : ""} />
        </Button>
        <Input
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          {...this.props}
          placeholder="No description provided"
          onChange={(e, data) => {
            this.setState({ value: data.value });
          }}
          defaultValue={this.props.name}
        >
          <input
            style={{
              borderColor: this.state.focus ? "" : "transparent",
              textDecoration: this.props.isChecked ? "line-through" : "none",
              opacity: this.props.isChecked ? "0.5" : ""
            }}
          />
        </Input>
        <Dropdown
          icon={<Icon name="ellipsis vertical" style={{ opacity: "0.5" }} />}
          style={{ float: "right" }}
        >
          <Dropdown.Menu style={{ left: "auto", right: 0 }}>
            {/* TO DO 
                <Dropdown.Item content="Move up" icon="arrow up" />
                <Dropdown.Item content="Move down" icon="arrow down" />
				*/}
            <Dropdown.Item
              content="Delete"
              icon="trash"
              onClick={this.handleDelete}
            />
          </Dropdown.Menu>
        </Dropdown>
      </div>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.onToggleItem = this.onToggleItem.bind(this);
    this.onDeleteItem = this.onDeleteItem.bind(this);
    this.onAddItem = this.onAddItem.bind(this);
    this.onEditItem = this.onEditItem.bind(this);
    this.state = {
      //Note that docID is a JSON object
      docID: null,
      checkList: {
        version: 1,
        items: []
      }
    };
  }

  componentDidMount() {
    //Initialize state
    api.getCurrentDocumentId().then(docID => {
      this.setState({
        docID: docID
      });

      api.getFields(docID, [{ id: checklists_field_ID }]).then(fields => {
        if (JSON.stringify(fields[0].value) != "null") {
          //TODO: manage versionning
          //TODO: manage old non-JSON content
          this.setState({
            checkList: JSON.parse(fields[0].value)
          });
          //this.setState(prevState => ({ docID: docID, checkList: JSON.parse(fields[0].value), docID: docID }));
        }
      });
    });
  }

  componentDidUpdate() {
    postContentSize();
  }

  onToggleItem(checkItemId) {
    const newitems = this.state.checkList.items.map(checkItem => {
      if (checkItem.id !== checkItemId) return checkItem;
      return {
        ...checkItem,
        isChecked: !checkItem.isChecked
      };
    });

    var newCheckList = {
      version: module_version,
      items: newitems
    };
    var fieldsToSet = [
      OMApi.stringField(JSON.stringify(newCheckList), checklists_field_ID)
    ];
    api.setFields(this.state.docID, fieldsToSet).then(setFieldAnswer => {
      //console.log(setFieldAnswer);
    });
    this.setState(prevState => ({ checkList: newCheckList }));
  }

  onEditItem(checkItemId, value) {
    const newitems = this.state.checkList.items.map(checkItem => {
      if (checkItem.id !== checkItemId) return checkItem;
      return {
        ...checkItem,
        name: value
      };
    });

    var newCheckList = {
      version: module_version,
      items: newitems
    };
    var fieldsToSet = [
      OMApi.stringField(JSON.stringify(newCheckList), checklists_field_ID)
    ];
    api.setFields(this.state.docID, fieldsToSet).then(setFieldAnswer => {
      //console.log(setFieldAnswer);
    });
    this.setState(prevState => ({ checkList: newCheckList }));
  }
  onDeleteItem(checkItemId) {
    const newitems = this.state.checkList.items.filter(
      checkItem => checkItem.id !== checkItemId
    );
    var newCheckList = {
      version: module_version,
      items: newitems
    };
    var fieldsToSet = [
      OMApi.stringField(JSON.stringify(newCheckList), checklists_field_ID)
    ];
    api.setFields(this.state.docID, fieldsToSet).then(setFieldAnswer => {
      //console.log(setFieldAnswer);
    });
    this.setState(prevState => ({ checkList: newCheckList }));
  }
  onAddItem(value) {
    // start by reading again checklist from database, in case another user made an update since the last read.
    api
      .getFields(this.state.docID, [{ id: checklists_field_ID }])
      .then(fields => {
        if (JSON.stringify(fields[0].value) != "null") {
          var newCheckList = JSON.parse(fields[0].value);
        } else {
          var newCheckList = this.state.checkList;
        }

        var newCheckItem = {
          id: guid(),
          name: value,
          isChecked: false
        };

        //Update checklist history and empty textArea
        newCheckList.items.push(newCheckItem);

        var fieldsToSet = [
          OMApi.stringField(JSON.stringify(newCheckList), checklists_field_ID)
        ];
        api.setFields(this.state.docID, fieldsToSet).then(setFieldAnswer => {
          //console.log(setFieldAnswer);
        });
        //TODO: manage error

        this.setState({
          checkList: newCheckList
        });
        //put the focus back to the textAreaValue
        document.getElementById("textArea").focus();
      });
  }

  render() {
    return this.state.checkList.items.length < 1 ? (
      <div>
        <NewListItemInput onAddItem={this.onAddItem} id="textArea" />
        <br />
      </div>
    ) : (
      <div>
        <Progress
          value={
            this.state.checkList.items.filter(
              checkItem => checkItem.isChecked === true
            ).length
          }
          total={this.state.checkList.items.length}
          progress="ratio"
          autoSuccess
        />

        {this.state.checkList.items.map((checkItem, key) => (
          <CheckItem
            key={checkItem.id}
            isChecked={checkItem.isChecked}
            name={checkItem.name}
            checkItemId={checkItem.id}
            onToggleItem={this.onToggleItem}
            onEditItem={this.onEditItem}
            onDeleteItem={this.onDeleteItem}
          />
        ))}
        <br />
        <NewListItemInput onAddItem={this.onAddItem} id="textArea" />

        <br />
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));

function postContentSize() {
  const contentSize: WpLib.Notify.View.ContentSizeData = {
    width: document.getElementById("root").scrollWidth,
    height: document.getElementById("root").scrollHeight
  };
  plugin.postNotify(
    WpLib.Notify.View.Module,
    WpLib.Notify.View.ContentSize,
    contentSize
  );
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return (
    s4() +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    s4() +
    s4()
  );
}
