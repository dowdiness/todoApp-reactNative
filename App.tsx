import React from 'react'
import { Button, StyleSheet, Text, View, TextInput, Keyboard} from 'react-native';
import { Stitch, AnonymousCredential, RemoteMongoClient } from 'mongodb-stitch-react-native-sdk';
 
export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      currentUserId: undefined,
      client: undefined,
      mongoClient: undefined,
      value: false,
      text: ''
    };
    this._loadClient = this._loadClient.bind(this);
    this._onPressLogin = this._onPressLogin.bind(this);
    this._onPressLogout = this._onPressLogout.bind(this);
    this._onCreateTodo = this._onCreateTodo.bind(this);
  }
 
  componentDidMount() {
    this._loadClient();
  }
 
  render() {
    let loginStatus = "Currently logged out."
 
    if(this.state.currentUserId) {
      loginStatus = `Currently logged in as ${this.state.currentUserId}!`
    }
 
    const loginButton = <Button
                    style={styles.button}
                    onPress={this._onPressLogin}
                    title="Login"/>
 
    const logoutButton = <Button
                    style={styles.button}
                    onPress={this._onPressLogout}
                    title="Logout"/>
 
    return (
      <View style={styles.container}>
        <Text style={styles.header}>TodoApp</Text>
        <TextInput
          style={{margin: 32, padding: 12, height: 40, width: '80%', borderColor: 'gray', borderWidth: 1}}
          placeholder='Type your todo'
          placeholderTextColor='gray'
          onChangeText={(text) => this.setState({text})}
          value={this.state.text}
          onSubmitEditing={() => this._onCreateTodo()}
        />
        {this.state.currentUserId !== undefined ? logoutButton : loginButton}
      </View>
    );
  }
 
  _loadClient() {
    Stitch.initializeDefaultAppClient('todoreact-xwgod').then(client => {
      this.setState({ client });
      if(client.auth.isLoggedIn) {
        this.setState({ currentUserId: client.auth.user.id })
      }
      const mongoClient = client.getServiceClient(
        RemoteMongoClient.factory,
        "todoApp"
      );
      this.setState({ mongoClient })
    });
  }
 
  _onPressLogin() {
    this.state.client.auth.loginWithCredential(new AnonymousCredential()).then(user => {
        console.log(`Successfully logged in as user ${user.id}`);
        this.setState({ currentUserId: user.id })
    }).catch(err => {
        console.log(`Failed to log in anonymously: ${err}`);
        this.setState({ currentUserId: undefined })
    });
  }
 
  _onPressLogout() {
    this.state.client.auth.logout().then(user => {
        console.log(`Successfully logged out`);
        this.setState({ currentUserId: undefined })
    }).catch(err => {
        console.log(`Failed to log out: ${err}`);
        this.setState({ currentUserId: undefined })
    });
  }

  _onCreateTodo() {
    Keyboard.dismiss();
    const db = this.state.mongoClient.db('taskmanager')
    const tasks = db.collection('tasks')
    if (this.state.text != "") {
      tasks
        .insertOne({
          status: "new",
          description: this.state.text,
          date: new Date()
        })
        .then(() => {
          this.setState({ value: !this.state.value });
          this.setState({ text: "" });
        })
        .catch(err => {
          console.warn(err);
        });
    }
  }
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 48
  },
  button: {
    margin: 62
  }
});